"""Bake source-aligned front end and wheel textures from the bundled manufacturer media.

Run from the repo using Python with Pillow and NumPy. Coordinates are in a
standard 800 px-wide version of each original, so they survive re-encoding.
The centre, near shoulder and far shoulder control rails follow the actual
bonnet and valance. Only the occluded outer lamp is filled from its counterpart.
"""
from pathlib import Path
from functools import lru_cache
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / 'public' / 'cars'
DEST = ROOT / 'src' / 'assets' / 'orbit-panels'

# Front tuples: input, centre top/bottom, near top/bottom, far top/bottom,
# half-width over which the full original nose (and its letterforms) is used.
# Optional middle stations compensate for projection over the curved skin.
FRONTS = {
    'jaecoo-j5': ('front', (127,128,122,281), (347,121,321,289), (58,140,58,266), .36),
    'jaecoo-j7': ('front', (190,162,183,375), (487,151,465,381), (28,173,9,354), .48),
    'corolla-cross': ('front', (134,178,130,351), (427,155,388,366), (23,188,17,342), .37),
    'hr-v': ('front', (225,185,213,414), (572,143,551,438), (68,174,54,390), .47),
    'sportage-l': ('fascia', (400,114,400,476), (792,111,792,473), (9,112,10,473), 1),
    'mg-hs-hybrid-plus': ('cover',(660,145,677,296),(431,126,458,309),(741,153,748,284),.46),
    'mg-hs-super-hybrid': ('cover',(660,145,677,295),(431,126,458,309),(741,152,748,284),.46),
    'haval-h6-gt': ('cover',(93,115,85,257),(270,106,245,260),(60,128,49,242),.34),
    'omoda-7': ('front',(686,116,696,251),(467,103,487,255),(733,125,749,242),.40),
    'tiggo-7': ('front',(584,202,584,295),(442,191,440,298),(617,207,629,293),.40),
    'tiggo-8': ('front',(277,180,273,337),(490,165,482,350),(166,194,161,325),.45),
    'tiggo-9': ('front',(400,205,400,427),(638,195,633,421),(161,195,168,421),1),
    'byd-shark-6': ('cover',(131,124,113,281),(277,118,271,293),(52,138,52,267),.49),
}
# Wheel tuples are the actual rim ellipse: centre, horizontal radius, vertical
# radius, and the horizontal offset of the top of the wheel due to perspective.
WHEELS = {
    'jaecoo-j5':('front',400,268,34,53,3),
    'jaecoo-j7':('front',546,351,26,77,1),
    'corolla-cross':('front',450,327,28,60,4),
    'hr-v':('front',624,373,25,84,4),
    'sportage-l':('front',370,259,35,52,4),
    'mg-hs-hybrid-plus':('cover',387,282,36,58,-7),
    'mg-hs-super-hybrid':('cover',387,282,36,58,-7),
    'haval-h6-gt':('side',162,220,39,40,1),
    'omoda-7':('front',437,248,35,52,-4),
    'tiggo-7':('side',165,232,43,43,0),
    'tiggo-8':('side',166,230,45,44,0),
    'tiggo-9':('side',175,225,44,44,0),
    'byd-shark-6':('side',157,211,35,35,0),
}

@lru_cache(maxsize=2)
def source_image(model, name):
    with Image.open(IMAGES / model / (name+'.webp')) as img:
        return np.array(img.convert('RGBA'), dtype=np.float32)


# Native pixel bounds for the make badge and registration plate. The second y
# pair gives the offset at the right-hand border of each image feature.
# Width is specified in rectified grille UVs. Original lettering stays legible.
DECALS = {
    'jaecoo-j5': [(120,193,197,219,0,0,.173),(98,265,215,313,0,2,.288)],
    'jaecoo-j7': [(143,214,267,243,-1,-1,.228),(119,303,289,362,2,1,.322)],
    'corolla-cross': [(159,291,220,346,0,1,.126),(129,386,239,456,2,2,.263)],
    'hr-v': [(239,276,310,344,0,2,.146),(160,357,383,434,14,17,.352)],
    'mg-hs-hybrid-plus': [(1014,239,1067,276,0,1,.12),(977,350,1133,408,-10,-12,.29)],
    'mg-hs-super-hybrid': [(1014,239,1067,276,0,1,.12),(977,350,1133,408,-10,-12,.29)],
    'haval-h6-gt': [(60,117,97,134,0,1,.151),(52,159,102,190,3,4,.253)],
    'omoda-7': [(1194,228,1348,251,0,1,.30),(1214,347,1349,418,-7,-8,.34)],
    'tiggo-7': [(1048,404,1111,435,0,1,.181),(1034,461,1128,512,-2,-3,.282)],
    'tiggo-8': [(101,85,127,98,0,0,.166),(93,106,136,120,2,2,.285)],
    'byd-shark-6': [(93,224,308,296,-4,-4,.482),(122,337,248,402,0,0,.30)],
}
def sample(model, name, x, y):
    src = source_image(model, name)
    scale = src.shape[1] / 800
    x, y = np.clip(x*scale, 0, src.shape[1]-1.001), np.clip(y*scale, 0, src.shape[0]-1.001)
    ix, iy = x.astype(int), y.astype(int)
    dx, dy = (x-ix)[...,None], (y-iy)[...,None]
    return (src[iy,ix]*(1-dx)+src[iy,ix+1]*dx)*(1-dy)+(src[iy+1,ix]*(1-dx)+src[iy+1,ix+1]*dx)*dy

def ramp(x, a, b):
    t = np.clip((x-a)/(b-a), 0, 1)
    return t*t*(3-2*t)

def make_front(model, settings):
    filename, centre, near, far, keep = settings
    h, w = 288, 640
    v, u = np.mgrid[0:h,0:w] / np.array([h-1,w-1])[:,None,None]
    d = (2*u-1) * np.sign(near[0]-centre[0])
    def rail(r):
        x = (1-v)*r[0]+v*r[2]
        y = (1-v)*r[1]+v*r[3]
        return x, y
    cx,cy=rail(centre)
    nx,ny=rail(near)
    fx,fy=rail(far)
    absolute=np.abs(d)
    present=sample(model,filename, cx+(nx-cx)*absolute, cy+(ny-cy)*absolute)
    original=sample(model,filename, cx+(fx-cx)*absolute, cy+(fy-cy)*absolute)
    # Around the make badge and plate the far half must also come from the
    # original. On the outer corner the curved surface is often self-occluded.
    reflection=np.ones_like(d) if keep < 1 else np.where(d<0,0,1)
    pixels=original*(1-reflection[...,None])+present*reflection[...,None]
    for left,top,right,bottom,tilt_top,tilt_bottom,width in DECALS.get(model,[]):
        scale=800 / source_image(model,filename).shape[1]
        t=((top+tilt_top/2)*scale-centre[1])/(centre[3]-centre[1])
        b=((bottom+tilt_bottom/2)*scale-centre[1])/(centre[3]-centre[1])
        dx=(u-.5)/width+.5
        dy=(v-t)/(b-t)
        sx=(left+(right-left)*dx)*scale
        sy=((top+tilt_top*dx)*(1-dy)+(bottom+tilt_bottom*dx)*dy)*scale
        actual=sample(model,filename,sx,sy)
        blend=(ramp(dx,0,.035)*ramp(1-dx,0,.035)*ramp(dy,0,.09)*ramp(1-dy,0,.09))[...,None]
        pixels=pixels*(1-blend)+actual*blend
    edge=ramp(u,0,.037)*ramp(1-u,0,.037)*ramp(v,0,.12)*ramp(1-v,0,.12)
    pixels[:,:,3]*=edge
    return Image.fromarray(np.uint8(np.clip(pixels,0,255)))

def make_wheel(model,settings):
    src,cx,cy,rx,ry,shear=settings
    yy,xx=np.mgrid[-1:1:192j,-1:1:192j]
    pixels=sample(model,src,cx+rx*xx-shear*yy,cy+ry*yy)
    pixels[:,:,3]*=1-ramp(np.sqrt(xx*xx+yy*yy),.966,1)
    return Image.fromarray(np.uint8(np.clip(pixels,0,255)))

if __name__ == '__main__':
    DEST.mkdir(exist_ok=True,parents=True)
    for key in FRONTS:
        make_front(key,FRONTS[key]).save(DEST/(key+'-front.webp'),quality=93,method=5)
        make_wheel(key,WHEELS[key]).save(DEST/(key+'-wheel.webp'),quality=93,method=5)
