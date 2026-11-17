#!/usr/bin/env python3
"""Build four clean, painted-cartoon backdrops for Bounce Tales.

No phototextures, per-pixel noise, film grain, 3D/PBR effects or rock relief.
Deterministic flat shapes are painted at 1200x1600 so their silhouettes stay
smooth at browser and phone resolutions. The 15 RLEF levels remain untouched.
"""
from __future__ import annotations

import argparse
import json
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw

W, H = 1200, 1600
BIOMES = {
    "forest": {
        "sky": ("#60ACDF", "#B6E7F4", "#E8F8DA"),
        "hills": ("#A6D4AF", "#7EBD95", "#5F9F82", "#407E6C"),
        "rim": ("#D4E7AC", "#B7D98F", "#9FC888", "#7FB374"),
        "sun": "#FFF3B2", "cloud": "#F1FCF5", "leaf": "#478F6B",
        "leaf_lit": "#7BC48A", "trunk": "#47785A", "seed": 103,
    },
    "lagoon": {
        "sky": ("#58B4CD", "#A2E3DF", "#DCF5DF"),
        "hills": ("#A5DACC", "#78C0B1", "#4A9B93", "#307D82"),
        "rim": ("#D8F0DB", "#B2DEC5", "#8ECFB8", "#63B6A2"),
        "sun": "#FFF7C4", "cloud": "#F2FFF4", "leaf": "#337D72",
        "leaf_lit": "#65B5A1", "trunk": "#467E6F", "seed": 227,
    },
    "twilight": {
        "sky": ("#454A91", "#8477BE", "#C19BCF"),
        "hills": ("#9A90C3", "#7774AD", "#585A95", "#3E487B"),
        "rim": ("#D0C1E4", "#AAA5D0", "#888DBD", "#6875A9"),
        "sun": "#EDE7FF", "cloud": "#D5CDEB", "leaf": "#665C9A",
        "leaf_lit": "#ACA0D4", "trunk": "#4F4B84", "seed": 349,
    },
    "sunset": {
        "sky": ("#795EAA", "#F19B98", "#FFD39A"),
        "hills": ("#DB9BAC", "#BD799A", "#945F85", "#694B72"),
        "rim": ("#F5C1BB", "#E6A59E", "#C78A91", "#A76D7D"),
        "sun": "#FFE7A0", "cloud": "#FFE3C6", "leaf": "#A36775",
        "leaf_lit": "#D98D85", "trunk": "#87536B", "seed": 463,
    },
}


def rgb(value: str) -> tuple[int, int, int]:
    return tuple(bytes.fromhex(value.lstrip("#")))


def blend(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def y_on_ridge(x, layer, seed):
    baseline = H * (.49 + layer * .115)
    wave1 = 36 + layer * 12
    wave2 = 17 + layer * 7
    return baseline + wave1 * math.sin(x / W * math.tau * (1.16 + layer * .17) + seed * .13) + (
        wave2 * math.sin(x / W * math.tau * (2.8 + layer * .14) + seed * .07)
    )


def draw_gradient(image: Image.Image, stops):
    paint = ImageDraw.Draw(image)
    colors = [rgb(c) for c in stops]
    for y in range(H):
        t = y / (H - 1)
        position = min(1, int(t * 2))
        c = blend(colors[position], colors[position + 1], t * 2 - position)
        paint.line(((0, y), (W, y)), fill=c, width=1)


def draw_cloud(draw, x, y, width, color):
    # Rounded opaque shapes instead of blurred, noisy volumetric clouds.
    r = width / 2
    draw.ellipse((x-r*.83, y-r*.29, x-r*.19, y+r*.30), fill=color)
    draw.ellipse((x-r*.44, y-r*.51, x+r*.30, y+r*.32), fill=color)
    draw.ellipse((x+r*.01, y-r*.30, x+r*.76, y+r*.30), fill=color)
    draw.rounded_rectangle((x-r*.82, y-r*.02, x+r*.76, y+r*.30),
                           radius=max(4, int(r*.11)), fill=color)


def forest_tree(draw, x, y, size, c):
    trunk, foliage, highlight = c["trunk"], c["leaf"], c["leaf_lit"]
    thick = max(5, int(size*.08))
    draw.line((x, y, x, y-size*.63), fill=trunk, width=thick)
    draw.ellipse((x-size*.42,y-size*.91,x+size*.18,y-size*.34), fill=foliage)
    draw.ellipse((x-size*.16,y-size*1.05,x+size*.51,y-size*.41), fill=foliage)
    draw.ellipse((x-size*.50,y-size*.76,x+size*.39,y-size*.32), fill=foliage)
    draw.ellipse((x-size*.36,y-size*.86,x+size*.08,y-size*.57), fill=highlight)


def lagoon_plant(draw, x, y, size, c):
    draw.line((x,y,x+size*.06,y-size*.71),fill=c["trunk"],width=max(4,int(size*.06)))
    for sign in (-1,1):
        draw.polygon([(x+size*.05,y-size*.57),
                      (x+sign*size*.56,y-size*.86),
                      (x+sign*size*.42,y-size*.42),
                      (x+size*.05,y-size*.34)], fill=c["leaf"])
    draw.ellipse((x-size*.25,y-size*.93,x+size*.32,y-size*.65),
                 fill=c["leaf_lit"])


def crystal(draw, x, y, size, c):
    width=size*.25
    draw.polygon([(x-width,y),(x-width*.78,y-size*.55),
                  (x,y-size),(x+width*.89,y-size*.49),(x+width,y)],
                 fill=c["leaf"])
    draw.polygon([(x-width*.78,y-size*.55),(x,y-size),
                  (x+width*.18,y-size*.44),(x,y)],fill=c["leaf_lit"])


def sunset_tree(draw, x, y, size, c):
    draw.line((x,y,x,y-size*.58),fill=c["trunk"],width=max(5,int(size*.075)))
    draw.ellipse((x-size*.46,y-size*.83,x+size*.32,y-size*.33),fill=c["leaf"])
    draw.ellipse((x-size*.10,y-size*.98,x+size*.53,y-size*.44),fill=c["leaf"])
    draw.ellipse((x-size*.33,y-size*.85,x+size*.17,y-size*.62),fill=c["leaf_lit"])


def backdrop(name, config):
    image = Image.new("RGB", (W,H))
    draw_gradient(image,config["sky"])
    d = ImageDraw.Draw(image)
    sun_x = W * (.24 if name=="forest" else .73)
    sun_y = H * (.19 if name!="sunset" else .30)
    sun_r = 94 if name!="twilight" else 79
    d.ellipse((sun_x-sun_r, sun_y-sun_r, sun_x+sun_r, sun_y+sun_r),
              fill=config["sun"])
    if name=="twilight":
        for i in range(19):
            xx=70+(i*173)%1100; yy=95+(i*83)%420
            d.ellipse((xx-3,yy-3,xx+3,yy+3),fill="#F3E7FF")
    else:
        for x,y,s in [(210,240,125),(775,175,170),(1030,380,104),(390,470,125)]:
            draw_cloud(d,x,y+(config["seed"]%30),s,config["cloud"])

    # Each mountain ridge is a simple flowing silhouette with a broad
    # hand-painted highlight. No noisy relief and no photographic textures.
    rng = random.Random(config["seed"])
    for layer,(color,rim) in enumerate(zip(config["hills"],config["rim"])):
        pts=[(x,round(y_on_ridge(x,layer,config["seed"])))
             for x in range(-20,W+30,10)]
        d.polygon(pts+[(W+20,H+20),(-20,H+20)],fill=color)
        d.line(pts,fill=rim,width=5 if layer>=2 else 3,joint="curve")
        # Trees and structures sit on the middle hills, far behind playable
        # objects. Scale stays large and intentionally illustrative.
        if layer not in (1,2):
            continue
        num=10 if layer==1 else 15
        for j in range(num):
            x=round((j+.5)*W/num+rng.uniform(-24,24))
            y=round(y_on_ridge(x,layer,config["seed"])+6)
            size=rng.randint(55,100) if layer==1 else rng.randint(90,150)
            if name=="forest":
                forest_tree(d,x,y,size,config)
            elif name=="lagoon":
                lagoon_plant(d,x,y,size,config)
            elif name=="twilight":
                crystal(d,x,y,size,config)
            else:
                sunset_tree(d,x,y,size,config)
    return image


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output",default="remaster/assets/scenery")
    args = parser.parse_args()
    folder = Path(args.output)
    folder.mkdir(parents=True,exist_ok=True)
    manifest={"version":2,"style":"cartoon-retro-hd","width":W,"height":H,"biomes":{}}
    for name,config in BIOMES.items():
        file=name+".webp"
        art=backdrop(name,config)
        art.save(folder/file,format="WEBP",quality=90,method=6)
        assert (folder/file).stat().st_size>1000
        manifest["biomes"][name]=file
        print(f"Painted {name}: {W}x{H}, {round((folder/file).stat().st_size/1024)} KiB",flush=True)
    (folder/"manifest.json").write_text(json.dumps(manifest,separators=(",",":")),encoding="utf-8")


if __name__=="__main__":
    main()
