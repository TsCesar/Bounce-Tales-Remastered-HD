#!/usr/bin/env python3
"""Build high-resolution atlases from the original Bounce Tales sprite crops."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from PIL import Image

PAGE_SIZE = 2048
PADDING = 8
GUTTER = PADDING // 2
MANIFEST_VERSION = 5


def source_sprites(catalogue: dict, image_map: dict) -> list[dict]:
    """Include the static catalogue and the extra directly drawable image maps."""
    sprites = list(catalogue["sprites"])
    assert len(sprites) == catalogue["static_sprite_count"] == 326
    assert [entry["png"] for entry in catalogue["png_images"]] == image_map["atlases"]
    for sprite_id, entry in image_map["maps"].items():
        if int(sprite_id) < 326 or entry["type"] != "simple":
            continue
        sprites.append({
            "sprite_id": int(sprite_id),
            "image_slot": entry["image"],
            "crop": {
                "x": entry["atlasX"], "y": entry["atlasY"],
                "width": entry["width"], "height": entry["height"],
            },
            "draw_offset": {"x": entry["originX"], "y": entry["originY"]},
        })
    return sprites


def sampling_for(crop: dict) -> str:
    """Small game/UI icons require discrete edges; larger scenery can be smooth."""
    width, height = int(crop["width"]), int(crop["height"])
    if min(width, height) <= 32 or width * height <= 1200:
        return "pixel"
    return "smooth"


def restore_sprite(image: Image.Image, scale: int, sampling: str) -> Image.Image:
    if image.mode != "RGBA":
        image = image.convert("RGBA")
    size = (image.width * scale, image.height * scale)
    sharp = image.resize(size, Image.Resampling.NEAREST)
    if sampling == "pixel":
        return sharp
    if sampling != "smooth":
        raise ValueError("Unknown sampling policy")
    # Blend a small amount of alpha-aware interpolation into the original
    # pixels. Keep opacity and the outer source pixels for silhouettes and seams.
    smooth = Image.blend(sharp, image.resize(size, Image.Resampling.BILINEAR), 0.25)
    smooth.putalpha(sharp.getchannel("A"))
    box = (scale, scale, size[0] - scale, size[1] - scale)
    sharp.paste(smooth.crop(box), box[:2])
    return sharp


def extrude_edges(image: Image.Image) -> Image.Image:
    """Extend edge pixels into the gap between smoothed atlas sprites."""
    width, height = image.size
    padded_width = width + 2 * GUTTER
    padded = Image.new("RGBA", (padded_width, height + 2 * GUTTER))
    padded.paste(image, (GUTTER, GUTTER))
    for edge_x, left in ((0, 0), (width - 1, width + GUTTER)):
        column = image.crop((edge_x, 0, edge_x + 1, height))
        padded.paste(column.resize((GUTTER, height), Image.Resampling.NEAREST), (left, GUTTER))
    for edge_y, top in ((GUTTER, 0), (height + GUTTER - 1, height + GUTTER)):
        row = padded.crop((0, edge_y, padded_width, edge_y + 1))
        padded.paste(row.resize((padded_width, GUTTER), Image.Resampling.NEAREST), (0, top))
    return padded


class Atlas:
    def __init__(self):
        self.image = Image.new("RGBA", (PAGE_SIZE, PAGE_SIZE), (0, 0, 0, 0))
        self.next_x = PADDING
        self.next_y = PADDING
        self.row_height = 0

    def put(self, image: Image.Image, sampling: str):
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
        if sampling == "smooth":
            self.image.paste(extrude_edges(image), (xy[0] - GUTTER, xy[1] - GUTTER))
        else:
            self.image.paste(image, xy)
        self.next_x += width + PADDING
        self.row_height = max(self.row_height, height)
        return xy


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalogue", default="src/sprite-atlas.json")
    parser.add_argument("--image-map", default="src/image-map.json")
    parser.add_argument("--source", default="assets/original")
    parser.add_argument("--output", default="remaster/assets/hd")
    parser.add_argument("--scale", type=int, default=4, choices=[2, 4])
    args = parser.parse_args()

    catalogue = json.loads(Path(args.catalogue).read_text(encoding="utf-8"))
    image_map = json.loads(Path(args.image_map).read_text(encoding="utf-8"))
    sprites = source_sprites(catalogue, image_map)
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
    ordered = sorted(sprites, key=lambda s: (
        -s["crop"]["height"], -s["crop"]["width"], s["sprite_id"]))
    for entry in ordered:
        sid = entry["sprite_id"]
        if str(sid) in manifest_sprites:
            raise ValueError(f"Duplicate sprite {sid}")
        rect = entry["crop"]
        area = (rect["x"], rect["y"], rect["x"] + rect["width"], rect["y"] + rect["height"])
        sheet = original[entry["image_slot"]]
        if not (0 <= area[0] < area[2] <= sheet.width and 0 <= area[1] < area[3] <= sheet.height):
            raise ValueError(f"Sprite {sid} exceeds its original atlas")
        src = sheet.crop(area)
        policy = sampling_for(rect)
        enhanced = restore_sprite(src, args.scale, policy)
        location = pages[-1].put(enhanced, policy)
        if location is None:
            pages.append(Atlas())
            location = pages[-1].put(enhanced, policy)
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
        "spriteCount": len(manifest_sprites), "originalAtlases": len(original),
        "policyCounts": policy_counts,
        "pages": pages_list, "sprites": manifest_sprites,
    }
    (output / "manifest.json").write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
    print(f"Validated {len(manifest_sprites)} restored sprites: {policy_counts}; {len(pages)} pages.", flush=True)


if __name__ == "__main__":
    main()
