"""Bake closed-tailgate references used by the three-dimensional orbit mesh.

Pass a directory containing the original brochure(s) with the filenames
specified below. Source URLs and page numbers accompany each extraction.
Dependencies: Pillow, NumPy, pypdfium2.
"""
import argparse
from pathlib import Path

import numpy as np
import pypdfium2 as pdf
from PIL import Image

OUTPUT = Path(__file__).resolve().parents[1] / "src/assets/orbit-panels"
WIDTH, HEIGHT = 640, 288


def brochure_page(directory, filename, index, left_half=False):
    with pdf.PdfDocument(directory / filename) as document:
        page = document[index].render(scale=1.4).to_pil().convert("RGB")
    if left_half:
        page = page.crop((0, 0, page.width // 2, page.height))
    return page.resize((1024, round(page.height * 1024 / page.width)), Image.Resampling.LANCZOS)


def rectify(source, rows):
    """Sample the panel between measured edges, curving around bumper corners."""
    rows = np.asarray(rows)
    v = np.linspace(0, 1, HEIGHT)
    u = np.linspace(0, 1, WIDTH)
    sy = np.interp(v, rows[:, 0], rows[:, 1])[:, None]
    left = np.interp(v, rows[:, 0], rows[:, 2])[:, None]
    right = np.interp(v, rows[:, 0], rows[:, 3])[:, None]
    sx = left + u[None, :] * (right - left)
    sy = np.broadcast_to(sy, sx.shape)
    x, y = sx.astype(int), sy.astype(int)
    dx, dy = (sx - x)[:, :, None], (sy - y)[:, :, None]
    pixels = np.asarray(source.convert("RGB"), dtype=float)
    top = pixels[y, x] * (1 - dx) + pixels[y, x + 1] * dx
    bottom = pixels[y + 1, x] * (1 - dx) + pixels[y + 1, x + 1] * dx
    rgb = top * (1 - dy) + bottom * dy
    edge_x = np.minimum(u, 1 - u) / .022
    edge_y = np.minimum(v / .07, (1 - v) / .035)
    alpha = np.clip(np.minimum(edge_x[None, :], edge_y[:, None]), 0, 1)
    return Image.fromarray(np.dstack((rgb, 255 * alpha)).astype(np.uint8))


def j5(directory):
    # Page 9, official Jaecoo Pakistan J5 SHS brochure. Rear studio elevation.
    # https://headless-cms.omodajaecoo.pk/wp-content/uploads/2025/12/O-J-Jaecoo-J5-SHS-Brochure-02-CP-Low.pdf
    source = brochure_page(directory, "jaecoo-j5-design-reference.pdf", 8, left_half=True)
    rows = [(0, 197, 282, 724), (.075, 211, 271, 733),
            (.185, 238, 266, 739), (.37, 282, 248, 754),
            (.55, 327, 246, 757), (.75, 375, 246, 757),
            (.905, 413, 253, 752), (1, 437, 262, 742)]
    return rectify(source, rows)



def brochure_detail(directory, fraction, max_size):
    with pdf.PdfDocument(directory / "manufacturer-hrv.pdf") as document:
        page = document[8].render(scale=2.15).to_pil().convert("RGB")
    crop = page.crop(tuple(int(value * (page.width if i % 2 == 0 else page.height))
                           for i, value in enumerate(fraction)))
    crop.thumbnail(max_size)
    return crop


def panel_piece(canvas, image, mask_polygon, quad, box, symmetric=False):
    """Project a polygon on a single photographed surface, then blend its edges."""
    from PIL import ImageDraw, ImageFilter, ImageOps
    source = image.convert("RGBA")
    mask = Image.new("L", image.size)
    ImageDraw.Draw(mask).polygon(mask_polygon, fill=255)
    source.putalpha(mask.filter(ImageFilter.GaussianBlur(.7)))
    left, top, right, bottom = box
    piece = source.transform((right-left,bottom-top), Image.Transform.QUAD,
                             tuple(v for xy in quad for v in xy), Image.Resampling.BICUBIC)
    canvas.alpha_composite(piece, (left, top))
    if symmetric:
        canvas.alpha_composite(ImageOps.mirror(piece), (WIDTH - right, top))


def sportage(directory):
    # Kia America, 2026 Sportage Hybrid EX in Gravity Gray. Frame 14 is the
    # straight rear from the manufacturer configurator for the long-wheelbase facelift.
    # https://www.kia.com/us/content/dam/kia/us/en/vehicles/sportage-hybrid/2026/trims/ex/exterior/4f5257/360/14.png
    source = Image.open(directory / "kia-spin-2026-14.png").convert("RGB").crop((387,122,897,470))
    rows = [(0,95,80,420),(.08,107,73,430),(.23,136,63,440),
            (.41,170,55,450),(.58,202,52,451),(.78,240,54,451),
            (.90,263,56,448),(1,280,58,446)]
    return rectify(source, rows)


def hrv(directory):
    # Honda Atlas, HR-V e:HEV Pakistan, page 9. Close-up for the bar, crest
    # and lens internals, alongside a whole-vehicle image of the closed gate.
    # https://hondaittefaq.com.pk/wp-content/uploads/2025/11/HR-V-ehev-25-Brochure.pdf
    canvas = Image.new("RGBA", (WIDTH, HEIGHT))
    close = brochure_detail(directory, (.050,.445,.371,.725), (1100,700))
    lens = [(73,133),(80,116),(94,113),(112,124),(188,127),(354,127),(579,121),
            (596,116),(645,115),(658,119),(850,109),(954,101),(1012,93),(1026,100),
            (1032,115),(1033,157),(1026,173),(978,177),(947,185),(910,194),
            (862,177),(658,181),(654,191),(641,198),(599,201),(587,197),(581,190),
            (351,196),(299,218),(282,221),(182,214),(111,208),(83,199),(72,182)]
    panel_piece(canvas,close,lens,[(68,101),(68,228),(623,211),(623,109)],(5,15,320,88))
    panel_piece(canvas,close,lens,[(623,109),(623,211),(1036,193),(1036,84)],(320,15,635,88))
    body = brochure_detail(directory, (.54,.37,.89,.87), (1024,600))
    plate = [(781,224),(832,213),(842,256),(791,267)]
    panel_piece(canvas,body,plate,[(779,222),(789,269),(844,257),(834,211)],(246,131,394,184))
    black = [(645,317),(682,306),(702,296),(801,278),(873,263),(882,258),
             (883,297),(867,309),(799,333),(731,348),(711,347),(682,359),(647,362)]
    panel_piece(canvas,body,black,[(810,268),(810,333),(885,306),(885,253)],(320,203,635,284),True)
    return canvas


def haval_gt(directory):
    # GWM Creek, Pakistan, model-specific GWM Haval H6 GT rear detail.
    # https://www.gwm-creek.com/wp-content/uploads/2026/09/haval-h6-gt-exterior-2-scaled.jpg
    source = Image.open(directory / "rear-reference-gt-2.jpg").convert("RGB")
    source.thumbnail((720,1080))
    source = source.crop((0,450,source.width,1080))
    canvas = Image.new("RGBA", (WIDTH, HEIGHT))
    lamp = [(209,181),(214,176),(242,170),(298,165),(394,163),(526,172),
            (600,180),(605,210),(524,207),(478,209),(467,224),(273,234),(245,218)]
    panel_piece(canvas,source,lamp,[(205,151),(205,245),(602,258),(600,162)],(3,16,320,76),True)
    crest = [(577,218),(659,224),(660,246),(575,239)]
    panel_piece(canvas,source,crest,[(577,217),(576,241),(661,247),(660,223)],(263,81,377,99))
    plate = [(538,271),(655,273),(667,326),(551,330)]
    panel_piece(canvas,source,plate,[(534,267),(548,334),(670,330),(657,268)],(236,119,404,166))
    model = [(400,300),(478,303),(476,319),(400,320)]
    panel_piece(canvas,source,model,[(398,297),(398,321),(479,322),(479,299)],(78,142,133,156))
    vent = [(331,320),(344,306),(338,368),(329,405),(256,499),(264,469)]
    panel_piece(canvas,source,vent,[(255,297),(254,501),(346,501),(346,296)],(19,123,84,228),True)
    valance = [(250,540),(355,537),(395,484),(550,465),(565,462),(574,583),
               (553,600),(427,610),(305,604)]
    panel_piece(canvas,source,valance,[(248,527),(265,614),(576,593),(565,454)],(4,224,320,286),True)
    return canvas


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    if (args.directory / "jaecoo-j5-design-reference.pdf").exists():
        j5(args.directory).save(OUTPUT / "jaecoo-j5-rear.webp", quality=94, method=6)
    if (args.directory / "manufacturer-hrv.pdf").exists():
        hrv(args.directory).save(OUTPUT / "hr-v-rear.webp", quality=94, method=6)
    if (args.directory / "rear-reference-gt-2.jpg").exists():
        haval_gt(args.directory).save(OUTPUT / "haval-h6-gt-rear.webp", quality=94, method=6)
    if (args.directory / "kia-spin-2026-14.png").exists():
        sportage(args.directory).save(OUTPUT / "sportage-l-rear.webp", quality=94, method=6)
