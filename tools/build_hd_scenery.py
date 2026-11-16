#!/usr/bin/env python3
"""Generate high-resolution cinematic 2.5D scenery for all three world biomes.

The 15 original RLEF levels and their collision/visual object positions are
never modified. Four deterministic 1200x1600 painted backdrops provide
atmospheric depth behind the game's original parallax layers.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

WIDTH, HEIGHT = 1200, 1600

PALETTES = {
    "forest": {
        "sky": ((32, 101, 165), (119, 214, 231), (225, 248, 209)),
        "hills": [(91, 143, 163), (58, 112, 137), (29, 83, 96), (21, 70, 71)],
        "sun": (215, 221, (255, 245, 205)), "seed": 1201,
    },
    "lagoon": {
        "sky": ((20, 95, 120), (104, 209, 199), (213, 248, 230)),
        "hills": [(101, 167, 163), (70, 137, 147), (33, 107, 111), (13, 77, 84)],
        "sun": (945, 249, (217, 255, 241)), "seed": 2301,
    },
    "twilight": {
        "sky": ((23, 24, 71), (90, 58, 137), (213, 101, 143)),
        "hills": [(104, 67, 131), (69, 50, 101), (42, 38, 77), (27, 28, 57)],
        "sun": (905, 323, (249, 216, 255)), "seed": 3401,
    },
    "sunset": {
        "sky": ((64, 39, 100), (232, 114, 111), (255, 204, 128)),
        "hills": [(183, 102, 125), (125, 66, 99), (78, 46, 77), (42, 36, 63)],
        "sun": (815, 390, (255, 225, 160)), "seed": 4501,
    },
}


def interp_rgb(stops, t):
    t = np.clip(t, 0, 1)
    return np.stack([np.interp(t, [0, .48, 1], [a[c] for a in stops])
                     for c in range(3)], axis=-1).astype(np.float32)


def soft_noise(w, h, rng, grid=(24, 32)):
    base = Image.fromarray(rng.integers(0, 256, size=(grid[1], grid[0]), dtype=np.uint8), "L")
    return (np.asarray(base.resize((w, h), Image.Resampling.BICUBIC), dtype=np.float32) - 127.5) / 127.5


def make_backdrop(name, config, output):
    rng = np.random.default_rng(config["seed"])
    w, h = WIDTH, HEIGHT
    y = np.arange(h, dtype=np.float32)[:, None]
    x = np.arange(w, dtype=np.float32)[None, :]
    shade = interp_rgb(config["sky"], np.broadcast_to(y / (h * .99), (h, w)))
    broad = soft_noise(w, h, rng, (15, 20))
    wisps = soft_noise(w, h, rng, (35, 42))
    shade += (broad * 7.5 + wisps * 2.1)[:, :, None]

    sx, sy, sun_color = config["sun"]
    radius = ((x-sx)**2+(y-sy)**2)**.5
    halo = np.exp(-((radius / 470) ** 1.65)) * (0.38 if name != "twilight" else .32)
    for k in range(3):
        shade[:, :, k] = shade[:, :, k] * (1-halo) + sun_color[k] * halo
    disc = np.clip((132-radius)/22, 0, 1)
    for k in range(3):
        shade[:, :, k] = shade[:, :, k]*(1-disc*.74) + sun_color[k] * disc*.74

    # Atmospheric striation and gentle vignette; no obvious repeated patterns.
    striation = np.sin(y*.018 + np.sin(x*.006)*2.1)*np.exp(-((y-780)/720)**2)
    shade += striation[:, :, None]*1.3
    vignette = .12*np.clip(((x-w*.5)/(w*.62))**2 + ((y-h*.47)/(h*.7))**2,0,1)
    shade *= 1-vignette[:, :, None]
    image = Image.fromarray(np.uint8(np.clip(shade,0,255)), "RGB")

    # Soft layered clouds remain in the farthest plane.
    cloud_layer = Image.new("RGBA", (w,h),(0,0,0,0))
    clouds=ImageDraw.Draw(cloud_layer, "RGBA")
    if name != "twilight":
        for ci in range(40):
            xx=int(rng.uniform(-180,w+180)); yy=int(rng.uniform(110,740))
            rw=int(rng.uniform(70,230)); rh=int(rw*rng.uniform(.14,.39))
            light=(255,255,240,int(rng.integers(11,30)))
            clouds.ellipse((xx-rw,yy-rh,xx+rw,yy+rh),fill=light)
        cloud_layer=cloud_layer.filter(ImageFilter.GaussianBlur(38))
        image=Image.alpha_composite(image.convert("RGBA"),cloud_layer).convert("RGB")
    else:
        starfield=ImageDraw.Draw(image)
        for i in range(220):
            xx=int(rng.uniform(0,w)); yy=int(rng.uniform(0,h*.61))
            radius_star=float(rng.uniform(.6,1.9))
            starfield.ellipse((xx-radius_star,yy-radius_star,xx+radius_star,yy+radius_star),
                              fill=(204+int(rng.integers(0,52)),196,245))
    pix=np.asarray(image,dtype=np.float32).copy()
    rough = soft_noise(w,h,rng,(55,90))
    fine = soft_noise(w,h,rng,(160,190))

    # Four ridgelines, with per-pixel rock relief, striation and directional sun shading.
    for layer_id, base in enumerate(config["hills"]):
        yy0=int(h*(.48+.12*layer_id))
        amp=float(80+layer_id*33)
        frequencies=np.array([2.0,4.1,7.5,12.3])
        xx=np.arange(w,dtype=np.float32)
        ridge=np.full(w,yy0,dtype=np.float32)
        phase=rng.uniform(-3.0,3.0, size=4)
        for f, ph, strength in zip(frequencies,phase,[.50,.30,.13,.07]):
            ridge += amp*strength*np.sin(xx/w*np.pi*2*f+ph)
        sparse=rng.uniform(-1,1,size=(11+layer_id*4,))
        ridge += np.interp(xx,np.linspace(0,w,len(sparse)),sparse)*amp*.20
        mask=y>=ridge[None,:]
        normal=np.gradient(ridge)
        bounce_light=np.clip(-normal*.46,-14,14)[None,:]
        stone_detail=rough*(9+layer_id*4)+fine*(2+layer_id*1.5)+bounce_light
        d=np.maximum(0,y-ridge[None,:])
        depth_shade=np.minimum(42, d/(h*.45)*35)
        tint=stone_detail-depth_shade
        for k in range(3):
            channel=np.clip(base[k]+tint*(1 if k!=2 else .88),0,255)
            pix[:,:,k] = np.where(mask,channel,pix[:,:,k])
        # Slight mist gathers at the ridgelines.
        band=np.exp(-((y-ridge[None,:]-36)/50)**2)*(14-layer_id*2)
        for k in range(3):
            pix[:,:,k]+=np.where(mask,band*.53,0)

    image=Image.fromarray(np.uint8(np.clip(pix,0,255)),"RGB")
    paint=ImageDraw.Draw(image, "RGB")
    # Environmental silhouettes are purely distant, never physical obstacles.
    if name in ("forest","lagoon"):
        for t in range(94 if name=="forest" else 68):
            xx=int(rng.uniform(-30,w+30))
            yy=int(rng.uniform(h*.68,h*1.08))
            tall=int(rng.uniform(65,220))
            trunk=(14,70,69) if name=="lagoon" else (22,69,68)
            canopy=(23,99,91) if name=="lagoon" else (31,102,73)
            alpha_far=(yy/h)
            paint.line((xx,yy,xx+int(tall*.04),yy-tall),fill=trunk,
                       width=max(2,int(tall*.065)))
            for ci in range(4):
                cy=yy-tall+int(tall*ci*.13)
                cw=int(tall*(.24-ci*.025))
                paint.ellipse((xx-cw,cy-int(tall*.13),xx+cw,cy+int(tall*.12)),fill=canopy)
                if ci==0 and rng.random()>.5:
                    paint.arc((xx-cw,cy-int(tall*.13),xx+cw,cy+int(tall*.12)),
                              190,310,fill=(56,140,106),width=2)
    else:
        # Rock columns for the magical / violet biomes.
        for t in range(38):
            xx=int(rng.uniform(-30,w+30)); yy=int(rng.uniform(h*.78,h*1.1))
            ht=int(rng.uniform(50,190)); ww=int(ht*rng.uniform(.08,.15))
            rock=(58,43,82) if name=="twilight" else (70,45,76)
            paint.polygon([(xx-ww,yy),(xx-int(ww*.8),yy-ht*.58),
                           (xx,yy-ht),(xx+ww,yy-ht*.57),(xx+ww*1.3,yy)],fill=rock)
            paint.line((xx,yy-ht,xx-ww*.8,yy-ht*.58),fill=(133,88,142),width=2)
    # Filmic detail, deliberately low amplitude to preserve foreground contrast.
    return image


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",default="remaster/assets/scenery")
    args=parser.parse_args()
    output=Path(args.output)
    output.mkdir(parents=True,exist_ok=True)
    manifest={"version":1,"width":WIDTH,"height":HEIGHT,"biomes":{}}
    for name,settings in PALETTES.items():
        img=make_backdrop(name,settings,output)
        filename=name+".webp"
        img.save(output/filename,"WEBP",quality=90,method=5)
        manifest["biomes"][name]=filename
        print(f"Generated {filename}: {WIDTH}x{HEIGHT}; {(output/filename).stat().st_size/1024:.0f} KiB",flush=True)
    (output/"manifest.json").write_text(json.dumps(manifest,separators=(",",":")),encoding="utf-8")


if __name__=="__main__":
    main()
