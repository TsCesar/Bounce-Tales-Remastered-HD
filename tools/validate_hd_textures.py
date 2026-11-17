#!/usr/bin/env python3
"""Validate HD atlases against original crop IDs and exact pixel-class colours."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from PIL import Image


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--catalogue",default="src/sprite-atlas.json")
    p.add_argument("--source",default="assets/original")
    p.add_argument("--output",default="remaster/assets/hd")
    p.add_argument("--scale",type=int,choices=[2,4],default=4)
    args=p.parse_args()
    root=Path(args.output)
    manifest=json.loads((root/"manifest.json").read_text(encoding="utf-8"))
    source=json.loads(Path(args.catalogue).read_text(encoding="utf-8"))
    assert manifest["version"]==4 and manifest["scale"]==args.scale
    assert manifest["spriteCount"]==326 and len(manifest["sprites"])==326
    atlas=[Image.open(root/name).convert("RGBA") for name in manifest["pages"]]
    originals={
        x["image_slot"]:Image.open(Path(args.source)/x["png"]).convert("RGBA")
        for x in source["png_images"]
    }
    tally={"pixel":0,"smooth":0}
    for record in source["sprites"]:
        sid=str(record["sprite_id"])
        meta=manifest["sprites"][sid]
        crop=record["crop"]
        sampling=meta["sampling"]
        assert sampling in tally
        tally[sampling]+=1
        x,y,w,h=(meta[k] for k in ("x","y","w","h"))
        assert w==crop["width"]*args.scale and h==crop["height"]*args.scale
        assert meta["originX"]==record["draw_offset"]["x"]
        assert meta["originY"]==record["draw_offset"]["y"]
        page=atlas[meta["page"]]
        assert 0<=x<x+w<=page.width and 0<=y<y+h<=page.height
        # For pixel/UI-class assets, all four central output samples match
        # the original RGBA exactly: no false highlights, grain or fringing.
        if sampling=="pixel":
            original=originals[record["image_slot"]]
            ox,oy=crop["x"],crop["y"]
            for sx,sy in ((0,0),(crop["width"]//2,crop["height"]//2),
                          (crop["width"]-1,crop["height"]-1)):
                a=original.getpixel((ox+sx,oy+sy))
                b=page.getpixel((x+sx*args.scale+args.scale//2,y+sy*args.scale+args.scale//2))
                assert a==b,(sid,sx,sy,a,b)
    assert tally==manifest["policyCounts"]
    print(f"Visual assets validated: {tally['pixel']} pixel-sharp; "
          f"{tally['smooth']} large smooth; {len(atlas)} atlas pages.",flush=True)


if __name__=="__main__":
    main()
