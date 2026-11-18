"""Bake the model-specific rear texture overlays (Pillow and NumPy).

Run with Python from any directory. --source-cache accepts the two Chery images
named below. If absent they are read from Chery Pakistan's own model gallery.
The remaining references are the project's existing manufacturer exterior views.
"""
from __future__ import annotations

import argparse
from contextlib import nullcontext
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import urlopen

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
CHERY = {
    "tiggo7": "https://www.cherypakistan.com/wp-content/uploads/2026/04/five.webp",
    "tiggo8": "https://www.cherypakistan.com/wp-content/uploads/2026/01/step3.webp",
}
# TL, TR, BR, BL at a fit-inside 800 x 490 preview; center column of the rear
# badge corrects the additional near-side magnification in three-quarter images.
SOURCES = [
    ("shark", "byd-shark-6/tailgate", [(105,121),(401,82),(400,349),(110,343)], 241),
    ("cross", "corolla-cross/rear", [(388,177),(647,189),(652,337),(405,338)], 326),
    ("mg", "mg-hs-hybrid-plus/rear", [(454,102),(597,103),(600,209),(454,216)], 321),
    ("j7", "jaecoo-j7/rear", [(424,189),(513,185),(518,259),(417,259)], 167),
    ("omoda", "omoda-7/rear", [(225,151),(575,151),(575,286),(225,286)], 256),
    ("tiggo9", "tiggo-9/rear", [(232,114),(377,122),(384,219),(232,226)], 331),
    ("tiggo7", "tiggo7", [(255,190),(547,190),(550,349),(250,349)], 256),
    ("tiggo8", "tiggo8", [(73,39),(225,76),(221,179),(67,143)], 170),
]
# Original lens/plate/bumper pixels, plus lamp regions reflected to fill an
# occluded corner. Other pixels carry only embossed details and pressing lines.
REGIONS = {
    "shark": ([(0,28,512,47),(0,171,512,250),(467,32,512,145),(195,177,340,211)],
              [(468,29,512,145)]),
    "cross": ([(0,8,172,56),(373,8,511,51),(235,7,275,37),(167,49,380,64),
               (194,77,313,130),(459,77,499,113),(0,153,512,254)], [(0,3,175,55)]),
    "mg": ([(0,19,511,51),(239,4,282,30),(189,57,362,92),(0,178,512,246)], [(2,19,94,54)]),
    "j7": ([(15,6,502,43)], []),
    "omoda": ([(4,20,507,61)], []),
    "tiggo7": ([(168,0,341,13),(10,15,502,55),(185,78,330,122),(59,63,123,71),
                (391,123,440,139),(0,183,512,250)], []),
    "tiggo8": ([(0,14,510,61),(82,62,312,90),(157,94,326,157)], [(320,11,507,63)]),
    "tiggo9": ([(4,18,508,58),(190,75,351,124),(0,191,512,250)], [(6,20,130,57)]),
}


def rectify(path, points, center):
    source = Image.open(path).convert("RGB")
    scale = min(800/source.width, 490/source.height, 1)
    quad = tuple(k/scale for i in (0,3,2,1) for k in points[i])
    panel = source.transform((512,256), Image.Transform.QUAD, quad, Image.Resampling.BICUBIC)
    aligned = Image.new("RGB", (512,256))
    for source_box, offset in [((0,0,center,256),0),((center,0,512,256),256)]:
        half = panel.crop(source_box).resize((256,256), Image.Resampling.LANCZOS)
        aligned.paste(half,(offset,0))
    return aligned


def photo_ink(name, image):
    rectangles, reflections = REGIONS[name]
    for left,top,right,bottom in reflections:
        corner = ImageOps.mirror(image.crop((left,top,right,bottom)))
        feather = Image.new("L", corner.size, 0)
        ImageDraw.Draw(feather).rounded_rectangle((1,1,corner.width-1,corner.height-1),3,fill=255)
        image.paste(corner, (512-right,top), feather.filter(ImageFilter.GaussianBlur(2)))
    gray = image.convert("L")
    intensity = np.asarray(gray, dtype="float32")/255
    base = np.asarray(gray.filter(ImageFilter.GaussianBlur(5)), dtype="float32")/255
    detail = (intensity - base)/(base+.25)
    rgb = np.where((detail<0)[:,:,None], [12,14,15], [247,249,249])
    alpha = np.minimum(abs(detail)*1.8,.86)
    mask = Image.new("L",(512,256),0)
    draw = ImageDraw.Draw(mask)
    for rect in rectangles:
        draw.rounded_rectangle(rect,3,fill=247)
    selected = np.asarray(mask.filter(ImageFilter.GaussianBlur(2)),dtype="float32")/255
    if name in ("omoda","j7"):
        alpha.fill(0)
    if name == "shark":
        alpha[48:157,25:465] = np.minimum(.87,alpha[48:157,25:465]*1.7)
    output_alpha = selected+(1-selected)*alpha
    color = (np.asarray(image)*selected[:,:,None]+rgb*((1-selected)*alpha)[:,:,None])
    color /= np.maximum(.001,output_alpha[:,:,None])
    edge = Image.new("L",(512,256),0)
    ImageDraw.Draw(edge).rounded_rectangle((4,3,507,251),9,fill=255)
    output_alpha *= np.asarray(edge.filter(ImageFilter.GaussianBlur(3)),dtype="float32")/255
    result = Image.fromarray(np.clip(color,0,255).astype("uint8"))
    result.putalpha(Image.fromarray(np.clip(output_alpha*255,0,255).astype("uint8")))
    return result


def plate(draw, name, y, font):
    draw.rounded_rectangle((196,y,316,y+24),3,fill=(27,33,35,255),outline=(127,135,133,210),width=1)
    draw.text((256,y+12),name,font=font,fill=(225,231,229,255),anchor="mm")


def finish(name, result):
    try:
        font = ImageFont.truetype("arialbd.ttf", 12)
    except OSError:
        font = ImageFont.load_default(size=12)
    if name in ("j7","omoda"):
        draw = ImageDraw.Draw(result)
        draw.line([(38,55),(42,139),(61,161),(449,161),(468,142),(473,55)],
                  fill=(15,23,25,137), width=2)
        draw.polygon([(11,192),(69,184),(445,184),(501,193),(489,246),(21,246)],
                     fill=(34,42,45,240))
        draw.line([(67,224),(114,232),(394,232),(445,224)],fill=(115,126,127,240),width=4)
        if name == "omoda":
            draw.text((256,82),"O M O D A",font=font,fill=(202,210,212,255),anchor="mm")
        plate(draw,"JAECOO J7" if name=="j7" else "OMODA 7",108,font)
    elif name=="mg-super":
        draw=ImageDraw.Draw(result)
        draw.rectangle((169,55,363,95), fill=(0,0,0,0))
        plate(draw, "MG HS",65,font)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-cache",type=Path)
    args=parser.parse_args()
    out=ROOT/"src/assets/orbit/tails"
    out.mkdir(parents=True,exist_ok=True)
    with (nullcontext(args.source_cache) if args.source_cache else TemporaryDirectory()) as temporary:
        cache=Path(temporary)
        cache.mkdir(parents=True,exist_ok=True)
        for name,source,points,center in SOURCES:
            if source in CHERY:
                path=cache/(source+"-taillight-source.webp")
                if not path.is_file():
                    with urlopen(CHERY[source],timeout=20) as response:
                        path.write_bytes(response.read())
            else:
                path=ROOT/"public/cars"/(source+".webp")
            result=finish(name,photo_ink(name,rectify(path,points,center)))
            result.save(out/(name+".webp"),"WEBP",quality=92,method=3)
            if name=="mg":
                finish("mg-super",result.copy()).save(out/"mg-super.webp","WEBP",quality=92,method=3)


if __name__=="__main__":
    main()

