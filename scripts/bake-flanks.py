"""Bake door and glazing textures from the catalog's existing exterior photographs.

Landmarks use a 600 x 300 contain-fit preview. Hubs are (x, y, vertical tyre
radius). Sill and belt heights are measured at the rear and front hubs.
Cabin corners run rear-to-front along the belt and then along the roof.
Requires Pillow and NumPy; the generated WebPs are committed with the project.
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/assets/orbit-flanks"
# source, length, wheelbase, front axle U, rear hub, front hub, sill Ys, belt Ys,
# rear/front lower cabin, rear/center/front upper cabin
CARS = {
    "jaecoo-j5": ("front", 4.38, 2.62, .806, (525,193,50),(300,210,54), (205,222),(94,99), [(548,92),(334,99),(503,42),(439,29),(379,25)]),
    "jaecoo-j7": ("front", 4.50, 2.67, .810, (521,190,57),(390,209,72), (208,233),(79,99), [(510,77),(404,86),(480,39),(451,23),(417,20)]),
    "corolla-cross": ("front", 4.46, 2.64, .803, (506,177,47),(332,205,56), (199,230),(66,95), [(496,68),(349,96),(469,42),(426,29),(385,27)]),
    "hr-v": ("brochure", 4.35, 2.61, .807, (430,194,40),(134,194,40), (205,205),(101,112), [(438,96),(187,110),(391,74),(321,66),(263,69)]),
    "sportage-l": ("front", 4.66, 2.76, .808, (526,193,47),(278,212,55), (207,225),(76,96), [(530,72),(321,93),(492,47),(430,35),(373,32)]),
    "mg-hs-hybrid-plus": ("side", 4.67, 2.77, .805, (420,208,30),(180,210,30), (220,222),(133,145), [(431,130),(223,144),(400,112),(347,105),(293,107)]),
    "mg-hs-super-hybrid": ("cover", 4.67, 2.77, .805, (69,184,47),(289,211,57), (204,230),(76,98), [(80,72),(256,96),(120,36),(170,27),(211,30)]),
    "haval-h6-gt": ("side", 4.73, 2.74, .813, (435,200,45),(123,198,44), (204,205),(99,107), [(523,100),(190,106),(413,56),(326,49),(263,55)]),
    "omoda-7": ("side", 4.66, 2.72, .804, (160,213,38),(454,215,35), (204,210),(118,130), [(100,115),(402,129),(194,86),(275,83),(329,89)]),
    "tiggo-7": ("side", 4.55, 2.67, .807, (471,194,48),(123,196,48), (204,208),(75,103), [(547,74),(194,100),(486,47),(387,39),(306,43)]),
    "tiggo-8": ("side", 4.725, 2.71, .807, (471,195,49),(124,196,48), (199,204),(78,101), [(508,78),(194,99),(485,50),(379,44),(284,48)]),
    "tiggo-9": ("side", 4.81, 2.8, .804, (465,192,49),(132,193,47), (201,205),(82,99), [(526,82),(193,98),(475,50),(374,44),(294,46)]),
    "byd-shark-6": ("side", 5.46, 3.26, .843, (452,198,41),(118,197,41), (203,204),(106,111), [(397,107),(166,109),(388,60),(309,56),(245,60)]),
}

def smooth(x):
    x = np.clip(x,0,1)
    return x*x*(3-2*x)

def sample(img, x, y, alpha):
    h,w = img.shape[:2]
    scale=min(600/w,300/h,1)
    x=(x-(600-round(w*scale))//2)/scale
    y=(y-(300-round(h*scale))//2)/scale
    valid=(x>=0)&(y>=0)&(x<w-1)&(y<h-1)
    x=np.clip(x,0,w-1.001);y=np.clip(y,0,h-1.001)
    ix=x.astype(int);iy=y.astype(int)
    fx=(x-ix)[...,None];fy=(y-iy)[...,None]
    color=(img[iy,ix]*(1-fx)+img[iy,ix+1]*fx)*(1-fy)+(img[iy+1,ix]*(1-fx)+img[iy+1,ix+1]*fx)*fy
    color[...,3]*=alpha*valid
    return Image.fromarray(color.clip(0,255).astype('uint8'))

def grid(w,h):
    return np.broadcast_arrays(np.linspace(0,1,w)[None,:],np.linspace(1,0,h)[:,None])

# Sampling landmarks for the transparent area of the windscreen in each
# front-quarter photograph. The image on the pane contains the real cowl,
# dashboard, headrests and glass reflections at the captured angle.
WINDSCREENS = {
    'jaecoo-j5': ('front', [(153,89),(331,90),(241,33),(361,27)]),
    'jaecoo-j7': ('front', [(164,75),(394,76),(241,26),(406,22)]),
    'corolla-cross': ('front', [(158,83),(326,85),(244,36),(358,37)]),
    'hr-v': ('front', [(227,64),(409,65),(270,26),(420,24)]),
    'sportage-l': ('front', [(175,86),(300,85),(265,41),(351,35)]),
    'mg-hs-hybrid-plus': ('cover', [(255,79),(421,82),(226,28),(350,30)]),
    'mg-hs-super-hybrid': ('cover', [(256,80),(425,82),(224,35),(349,34)]),
    'haval-h6-gt': ('cover', [(180,90),(294,90),(252,47),(332,42)]),
    'omoda-7': ('opposite', [(239,80),(307,78),(305,46),(359,40)]),
    'tiggo-7': ('front', [(278,136),(385,137),(260,104),(329,104)]),
    'tiggo-8': ('front', [(256,126),(345,125),(285,104),(345,105)]),
    'tiggo-9': ('front', [(199,97),(403,98),(232,45),(374,45)]),
    'byd-shark-6': ('cover', [(170,79),(306,83),(230,35),(338,32)]),
}
MIRRORS = {
    # Centre, horizontal/vertical radii, clean glass sample offset.
    'jaecoo-j5': (375,77,27,14,8,-23),
    'jaecoo-j7': (444,66,28,14,9,-19),
    'corolla-cross': (395,82,24,13,9,-19),
    'hr-v': (216,106,14,10,17,-11),
    'sportage-l': (358,84,27,16,11,-23),
    'mg-hs-hybrid-plus': (246,134,13,8,9,-12),
    'mg-hs-super-hybrid': (217,80,24,16,-16,-19),
    'haval-h6-gt': (207,106,16,13,18,-13),
    'omoda-7': (371,119,17,12,-16,-14),
    'tiggo-7': (220,89,23,13,12,-18),
    'tiggo-8': (226,94,22,13,16,-19),
    'tiggo-9': (227,96,23,14,16,-19),
    'byd-shark-6': (198,101,15,11,19,-15),
}

def body_sample(model,img,x,y,alpha):
    base = sample(img,x,y,alpha)
    if model in MIRRORS:
        cx,cy,rx,ry,ox,oy=MIRRORS[model]
        radius=np.sqrt(((x-cx)/rx)**2+((y-cy)/ry)**2)
        mask=Image.fromarray(np.uint8(255*smooth((1.2-radius)/.32)))
        base=Image.composite(sample(img,x+ox,y+oy,alpha),base,mask)
    return base

def bake(model, config):
    file,length,wb,front,rear_hub,front_hub,sill,belt,cabin=config
    source=(ROOT/'scripts/orbit-references/hr-v-side.webp' if file=='brochure' else ROOT/f"public/cars/{model}/{file}.webp")
    img=np.asarray(Image.open(source).convert("RGBA"),dtype='float32')
    if file=='brochure':
        # Honda's side plate is pearl white. Match the cool finish of the
        # Pakistan reference on painted pixels, preserving the black glazing.
        amount=np.clip((img[...,:3].mean(axis=-1)-80)/115,0,1)[...,None]
        img[...,:3]*=1+amount*np.array([-.11,-.035,0])
    rear=front-wb/length
    u,v=grid(928,192)
    t=(u-rear)/(front-rear)
    xr,yr,rr=rear_hub
    xf,yf,rf=front_hub
    f=(t/rf)/((1-t)/rr+t/rf)
    lerp=lambda a,b: a*(1-f)+b*f
    x=lerp(xr,xf)
    base=lerp(*sill);peak=lerp(*belt)
    tire=.402 if model=="byd-shark-6" else .361
    for axle,hub in [(rear,rear_hub),(front,front_hub)]:
        dx=np.abs(u-axle)*length/(tire+.049)
        arc=hub[1]-(hub[2]+3)*np.sqrt(np.maximum(1-dx**2,0))
        base=np.where(dx<1,arc,base)
    y=base*(1-v)+peak*v
    # Fade towards the bumpers where a three-quarter photograph no longer shows
    # a tangent side surface. Leave the fender lip and sill as real geometry.
    alpha=smooth((t+.19)/.15)*smooth((1.15-t)/.13)*smooth((v-.015)/.09)*smooth((1-v)/.075)
    body_sample(model,img,x,y,alpha).save(OUT/f"{model}-body.webp",quality=92,method=6)
    u,v=grid(768,192)
    br,bf,tr,tm,tf=[np.array(p) for p in cabin]
    # Relative front/rear scales account for the longitudinal vanishing point.
    t=(u/rf)/((1-u)/rr+u/rf)
    top=np.stack([np.interp(t,[0,.5,1],[tr[i],tm[i],tf[i]]) for i in range(2)],axis=-1)
    bottom=br+(bf-br)*t[...,None]
    xy=bottom*(1-v[...,None])+top*v[...,None]
    alpha=smooth(u/.035)*smooth((1-u)/.035)*smooth(v/.035)*smooth((1-v)/.06)
    body_sample(model,img,xy[...,0],xy[...,1],alpha).save(OUT/f"{model}-glass.webp",quality=93,method=6)
    name,quad=WINDSCREENS[model]
    front_photo=np.array(Image.open(ROOT/f"public/cars/{model}/{name}.webp").convert('RGBA'), dtype='float32')
    bl,br,tl,tr=map(np.array,quad)
    u,v=grid(576,208)
    lower=bl+(br-bl)*u[...,None];upper=tl+(tr-tl)*u[...,None]
    xy=(1-v[...,None])*lower+v[...,None]*upper
    alpha=smooth(u/.019)*smooth((1-u)/.019)*smooth(v/.018)*smooth((1-v)/.018)
    sample(front_photo,xy[...,0],xy[...,1],alpha).save(OUT/f"{model}-windshield.webp",quality=94,method=6)

if __name__=="__main__":
    OUT.mkdir(exist_ok=True,parents=True)
    for key,values in CARS.items():
        bake(key,values)

