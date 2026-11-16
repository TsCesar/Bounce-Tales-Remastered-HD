#!/usr/bin/env python3
"""Build every verified V62 source sprite as a crisp 4x remastered texture.

Non-destructive, deterministic: reads the 46 original PNG resources and the
326-record sprite catalogue, exports independently resampled/treated sprites
into padded 2048px pages plus a new UV manifest. Source resources unchanged.
"""
from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

PAGE = 2048
PADDING = 4


def sprite_material(src: Image.Image, scale: int, sprite_id: int) -> Image.Image:
    """Alpha-premultiplied Lanczos + local material grain + micro-contrast.

    This sharpens existing art and adds texture detail; it is not a claim that
    a 240x320 original contains new photorealistic information.
    """
    rgba = np.asarray(src.convert("RGBA"), dtype=np.float32)
    alpha = rgba[..., 3] / 255.0
    premult = np.uint8(np.clip(rgba[..., :3] * alpha[..., None], 0, 255))
    target = (src.width * scale, src.height * scale)
    rgb_scaled = np.asarray(
        Image.fromarray(premult, mode="RGB").resize(target, Image.Resampling.LANCZOS),
        dtype=np.float32,
    )
    alpha_scaled = np.asarray(
        Image.fromarray(np.uint8(rgba[..., 3]), mode="L").resize(target, Image.Resampling.LANCZOS),
        dtype=np.float32,
    )
    unpremult = np.clip(
        rgb_scaled * 255.0 / np.maximum(alpha_scaled[..., None], 3.0),
        0.0,
        255.0,
    )
    h, w = unpremult.shape[:2]
    if min(src.size) >= 5:
        rng = np.random.default_rng(9012 + sprite_id)
        # Material variation is seeded and smooth; not per-frame TV static.
        coarse = Image.fromarray(
            rng.integers(0, 256, size=(max(3, h // 30), max(3, w // 30)), dtype=np.uint8),
            mode="L",
        ).resize((w, h), Image.Resampling.BICUBIC)
        fine = Image.fromarray(
            rng.integers(0, 256, size=(max(4, h // 6), max(4, w // 6)), dtype=np.uint8),
            mode="L",
        ).resize((w, h), Image.Resampling.BILINEAR)
        coarse_n = (np.asarray(coarse, dtype=np.float32) - 127.5) / 127.5
        fine_n = (np.asarray(fine, dtype=np.float32) - 127.5) / 127.5
        # Normal-like directional relief from stable texture detail.
        gy, gx = np.gradient(coarse_n)
        relief = np.clip((-0.65 * gx - 0.55 * gy) * 0.35, -0.17, 0.17)
        variation = 2.2 * coarse_n + 1.35 * fine_n + 10.0 * relief
        unpremult = np.clip(unpremult * 1.027 + variation[..., None], 0, 255)
    result = Image.fromarray(
        np.dstack([np.uint8(unpremult), np.uint8(alpha_scaled)]), mode="RGBA"
    )
    # UnsharpMask on RGB only: preserve exact transparent silhouettes.
    original_alpha = result.getchannel("A")
    rgb = ImageEnhance.Contrast(result.convert("RGB")).enhance(1.036)
    rgb = ImageEnhance.Color(rgb).enhance(1.038)
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.10, percent=82, threshold=3))
    rgb.putalpha(original_alpha)
    return rgb


class AtlasPage:
    def __init__(self) -> None:
        self.image = Image.new("RGBA", (PAGE, PAGE), (0, 0, 0, 0))
        self.x = PADDING
        self.y = PADDING
        self.shelf_height = 0
        self.used_height = 0

    def place(self, im: Image.Image):
        w, h = im.size
        if w + PADDING * 2 > PAGE or h + PADDING * 2 > PAGE:
            raise ValueError(f"Sprite too large for {PAGE}px atlas: {w}x{h}")
        if self.x + w + PADDING > PAGE:
            self.x = PADDING
            self.y += self.shelf_height + PADDING
            self.shelf_height = 0
        if self.y + h + PADDING > PAGE:
            return None
        x, y = self.x, self.y
        self.image.paste(im, (x, y))
        self.x += w + PADDING
        self.shelf_height = max(self.shelf_height, h)
        self.used_height = max(self.used_height, y + h + PADDING)
        return x, y


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalogue", default="src/sprite-atlas.json")
    parser.add_argument("--source", default="assets/original")
    parser.add_argument("--output", default="remaster/assets/hd")
    parser.add_argument("--scale", type=int, default=4, choices=[3, 4])
    args = parser.parse_args()

    catalogue = json.loads(Path(args.catalogue).read_text(encoding="utf-8"))
    assert catalogue["static_sprite_count"] == 326
    assert len(catalogue["png_images"]) == 46
    assert len(catalogue["sprites"]) == 326

    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    images: dict[int, Image.Image] = {}
    for entry in catalogue["png_images"]:
        slot = entry["image_slot"]
        file = Path(args.source, entry["png"])
        assert file.exists(), f"Missing source PNG {file}"
        im = Image.open(file).convert("RGBA")
        assert im.size == (entry["width"], entry["height"]), str(file)
        images[slot] = im

    pages = [AtlasPage()]
    manifest = {}
    # Taller sprites first reduce wasted shelf space, preserving stable ordering.
    sorted_sprites = sorted(
        catalogue["sprites"],
        key=lambda s: (-s["crop"]["height"], -s["crop"]["width"], s["sprite_id"]),
    )
    for sprite in sorted_sprites:
        sid = int(sprite["sprite_id"])
        crop = sprite["crop"]
        original = images[sprite["image_slot"]].crop(
            (crop["x"], crop["y"], crop["x"]+crop["width"], crop["y"]+crop["height"])
        )
        enhanced = sprite_material(original, args.scale, sid)
        placement = pages[-1].place(enhanced)
        if placement is None:
            pages.append(AtlasPage())
            placement = pages[-1].place(enhanced)
        if placement is None:
            raise RuntimeError(f"Sprite {sid} cannot fit into new atlas page")
        x, y = placement
        manifest[str(sid)] = {
            "page": len(pages) - 1,
            "x": x, "y": y,
            "w": enhanced.width, "h": enhanced.height,
            "logicalW": crop["width"], "logicalH": crop["height"],
            "originX": sprite["draw_offset"]["x"],
            "originY": sprite["draw_offset"]["y"],
        }
    assert len(manifest) == 326
    files = []
    for idx, page in enumerate(pages):
        filename = f"hd-{idx:02d}.png"
        # Keep atlas pages fixed at 2048 to simplify GPU texture recycling.
        page.image.save(out / filename, format="PNG", compress_level=6, optimize=True)
        files.append(filename)
        print(f"Atlas {filename}: {PAGE}x{PAGE}, {os.path.getsize(out / filename) / 1024:.0f} KiB", flush=True)
    result = {"version": 2, "scale": args.scale, "spriteCount": 326,
              "originalAtlases": 46, "pages": files, "sprites": manifest}
    (out / "manifest.json").write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
    print(f"Generated {len(manifest)} unique HD sprites across {len(pages)} atlas pages.", flush=True)


if __name__ == "__main__":
    main()
