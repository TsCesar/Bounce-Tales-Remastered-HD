#!/usr/bin/env python3
"""Validate every atlas sprite against the original crop and placement."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops
from build_hd_textures import GUTTER, MANIFEST_VERSION, extrude_edges, source_sprites


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--catalogue",default="src/sprite-atlas.json")
    p.add_argument("--image-map",default="src/image-map.json")
    p.add_argument("--source",default="assets/original")
    p.add_argument("--output",default="remaster/assets/hd")
    p.add_argument("--scale",type=int,choices=[2,4],default=4)
    args=p.parse_args()
    root=Path(args.output)
    manifest=json.loads((root/"manifest.json").read_text(encoding="utf-8"))
    source=json.loads(Path(args.catalogue).read_text(encoding="utf-8"))
    image_map=json.loads(Path(args.image_map).read_text(encoding="utf-8"))
    sprites=source_sprites(source,image_map)
    assert manifest["version"]==MANIFEST_VERSION and manifest["scale"]==args.scale
    assert manifest["spriteCount"]==len(sprites)
    assert manifest["sprites"].keys()=={str(record["sprite_id"]) for record in sprites}
    atlas=[Image.open(root/name).convert("RGBA") for name in manifest["pages"]]
    originals={
        x["image_slot"]:Image.open(Path(args.source)/x["png"]).convert("RGBA")
        for x in source["png_images"]
    }
    tally={"pixel":0,"smooth":0}
    for record in sprites:
        sid=str(record["sprite_id"])
        meta=manifest["sprites"][sid]
        crop=record["crop"]
        sampling=meta["sampling"]
        assert sampling in tally
        tally[sampling]+=1
        x,y,w,h=(meta[k] for k in ("x","y","w","h"))
        assert meta["logicalW"]==crop["width"] and meta["logicalH"]==crop["height"]
        assert w==crop["width"]*args.scale and h==crop["height"]*args.scale
        assert meta["originX"]==record["draw_offset"]["x"]
        assert meta["originY"]==record["draw_offset"]["y"]
        page=atlas[meta["page"]]
        assert 0<=x<x+w<=page.width and 0<=y<y+h<=page.height
        ox,oy=crop["x"],crop["y"]
        original=originals[record["image_slot"]].crop((ox,oy,ox+crop["width"],oy+crop["height"]))
        sharp=original.resize((w,h),Image.Resampling.NEAREST)
        actual=page.crop((x,y,x+w,y+h))
        if sampling=="pixel":
            assert actual.tobytes()==sharp.tobytes(), (sid,"original pixel colours")
        else:
            delta=ImageChops.difference(actual,sharp).getextrema()
            assert delta[3]==(0,0), (sid,"original opacity")
            assert max(high for _,high in delta[:3])<=64, (sid,"interpolation limit")
            size=args.scale
            for edge in ((0,0,w,size),(0,h-size,w,h),(0,0,size,h),(w-size,0,w,h)):
                assert actual.crop(edge).tobytes()==sharp.crop(edge).tobytes(), (sid,"original border")
            padded=page.crop((x-GUTTER,y-GUTTER,x+w+GUTTER,y+h+GUTTER))
            assert padded.tobytes()==extrude_edges(actual).tobytes(), (sid,"atlas padding")
    assert tally==manifest["policyCounts"]
    print(f"{len(sprites)} original crops validated: {tally['pixel']} exact, "
          f"{tally['smooth']} gently smoothed, {len(atlas)} atlas pages.",flush=True)


if __name__=="__main__":
    main()
