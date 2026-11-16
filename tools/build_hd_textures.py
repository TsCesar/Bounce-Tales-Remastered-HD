#!/usr/bin/env python3
"""Clean, category-aware restoration of all 326 verified Bounce Tales sprites.

This deliberately does not hallucinate new image detail: the source is 240x320
J2ME art. It avoids the old grain, aggressive sharpening, contrast shifts and
semi-transparent fringe artifacts. Original files and collision geometry remain
untouched. Run again for deterministic atlases and metadata.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from PIL import Image

PAGE_SIZE = 2048
PADDING = 8
MANIFEST_VERSION = 4


def sampling_for(crop: dict) -> str:
    """Small game/UI icons require discrete edges; larger scenery can be smooth."""
    width, height = int(crop["width"]), int(crop["height"])
    if min(width, height) <= 32 or width * height <= 1200:
        return "pixel"
    return "smooth"


def restore_sprite(image: Image.Image, scale: int, sampling: str) -> Image.Image:
    if sampling not in ("pixel", "smooth"):
        raise ValueError("Unknown sampling policy")
    # Pillow's RGBA Lanczos internally resamples premultiplied alpha.
    # Crucially: no synthetic grain, noise, unsharp mask or colour changes.
    resampling = Image.Resampling.NEAREST if sampling == "pixel" else Image.Resampling.LANCZOS
    return image.convert("RGBA").resize(
        (image.width * scale, image.height * scale), resampling
    )


class Atlas:
    def __init__(self):
        self.image = Image.new("RGBA", (PAGE_SIZE, PAGE_SIZE), (0, 0, 0, 0))
        self.next_x = PADDING
        self.next_y = PADDING
        self.row_height = 0

    def put(self, image: Image.Image):
        width, height = image.size
        if width + 2 * PADDING > PAGE_SIZE or height + 2 * PADDING > PAGE_SIZE:
            raise ValueError(f"Sprite too large for atlas: {width}x{height}")
        if self.next_x + width + PADDING > PAGE_SIZE:
            self.next_x = PADDING
            self.next_y += self.row_height + PADDING
            self.row_height = 0
        if self.next_y + height + PADDING > PAGE_SIZE:
            return None
        xy = (self.next_x, self.next_y)
        self.image.paste(image, xy)
        self.next_x += width + PADDING
        self.row_height = max(self.row_height, height)
        return xy


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalogue", default="src/sprite-atlas.json")
    parser.add_argument("--source", default="assets/original")
    parser.add_argument("--output", default="remaster/assets/hd")
    parser.add_argument("--scale", type=int, default=4, choices=[4])
    args = parser.parse_args()

    catalogue = json.loads(Path(args.catalogue).read_text(encoding="utf-8"))
    assert catalogue["static_sprite_count"] == 326
    assert len(catalogue["sprites"]) == 326
    assert len(catalogue["png_images"]) == 46
    original = {}
    for item in catalogue["png_images"]:
        file = Path(args.source) / item["png"]
        with Image.open(file) as png:
            assert png.size == (item["width"], item["height"]), f"Invalid original PNG: {file}"
            original[item["image_slot"]] = png.convert("RGBA")

    pages = [Atlas()]
    manifest_sprites = {}
    policy_counts = {"pixel": 0, "smooth": 0}
    ordered = sorted(catalogue["sprites"], key=lambda s: (
        -s["crop"]["height"], -s["crop"]["width"], s["sprite_id"]))
    for entry in ordered:
        sid = entry["sprite_id"]
        if str(sid) in manifest_sprites:
            raise ValueError(f"Duplicate sprite {sid}")
        rect = entry["crop"]
        area = (rect["x"], rect["y"], rect["x"] + rect["width"], rect["y"] + rect["height"])
        src = original[entry["image_slot"]].crop(area)
        policy = sampling_for(rect)
        enhanced = restore_sprite(src, args.scale, policy)
        location = pages[-1].put(enhanced)
        if location is None:
            pages.append(Atlas())
            location = pages[-1].put(enhanced)
        assert location is not None
        policy_counts[policy] += 1
        manifest_sprites[str(sid)] = {
            "page": len(pages) - 1, "x": location[0], "y": location[1],
            "w": enhanced.width, "h": enhanced.height,
            "logicalW": rect["width"], "logicalH": rect["height"],
            "originX": entry["draw_offset"]["x"],
            "originY": entry["draw_offset"]["y"],
            "sampling": policy,
        }

    assert len(manifest_sprites) == 326
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    pages_list = []
    for i, page in enumerate(pages):
        name = f"hd-{i:02d}.png"
        page.image.save(output / name, optimize=True, compress_level=6)
        pages_list.append(name)
        print(f"Clean atlas: {name} ({(output/name).stat().st_size//1024} KiB)", flush=True)
    result = {
        "version": MANIFEST_VERSION, "scale": args.scale,
        "spriteCount": 326, "originalAtlases": 46,
        "policyCounts": policy_counts,
        "pages": pages_list, "sprites": manifest_sprites,
    }
    (output / "manifest.json").write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
    print(f"Validated {len(manifest_sprites)} restored sprites: {policy_counts}; {len(pages)} pages.", flush=True)


if __name__ == "__main__":
    main()
