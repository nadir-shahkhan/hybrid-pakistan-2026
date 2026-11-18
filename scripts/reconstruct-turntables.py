"""Rebuild the orbit meshes from the manufacturer's transparent rotation frames.

Requires NumPy and Pillow. Run from any directory with:
    python scripts/reconstruct-turntables.py [model-folder ...]
The output contains a quantized, indexed surface net, calibrated cameras, and a
WebP projection atlas. All geometry and images are local.
"""
import base64
import io
import json
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'src/assets/turntable-meshes'
# length, body width, roof height, wheelbase, angle of first exposure,
# camera elevation and approximate distance to the axis, in metres and degrees.
MODELS = {
    'elantra': (4.68,1.83,1.42,2.72,50,6.5,13.0),
    'tucson': (4.64,1.87,1.67,2.76,40,7,13.5),
    'santa-fe': (4.79,1.90,1.71,2.77,37,7,13.5),
    'jetour-t1': (4.71,1.97,1.85,2.80,35,7.5,13.2),
    'jetour-t2': (4.79,2.01,1.88,2.80,40,7.0,13.5),
    'sorento': (4.82,1.90,1.70,2.82,45,4.0,17.0),
    'haval-h6-hev': (4.70,1.89,1.73,2.74,45,4.0,19.0),
    'haval-h6-phev': (4.70,1.89,1.73,2.74,45,4.0,19.0),
    'haval-jolion-hev': (4.47,1.84,1.62,2.70,45,4.0,19.0),
    'tank-500-phev': (5.08,1.93,1.91,2.85,45,4.0,19.0),
}
# Side-frame wheel centres as fractions of the opaque vehicle width and tyre radius in metres.
WHEELS = {
    'elantra': (.179,.789,.327), 'tucson': (.182,.81,.361), 'santa-fe': (.172,.805,.368),
    'jetour-t1': (.158,.792,.393), 'jetour-t2': (.17,.792,.401), 'sorento': (.177,.795,.36),
    'haval-h6-hev': (.185,.807,.365), 'haval-h6-phev': (.184,.804,.365),
    'haval-jolion-hev': (.19,.815,.35), 'tank-500-phev': (.174,.763,.394),
}
GWM = ['frontRightQuarter','rightSide','rearRightQuarter','rear',
       'rearLeftQuarter','leftSide','frontLeftQuarter','front']
TILE = (560,400)


def views(folder):
    base = ROOT / 'public/cars' / folder
    return sorted(base.glob('angle-*.webp')) or sorted(base.glob('spin-*.webp')) or [
        base / (name+'.webp') for name in GWM]


def projected(points, theta, elevation, distance, pivot):
    c,s=np.cos(theta), np.sin(theta)
    x,y,z=points.T
    h=c*x-s*z
    vertical=y-pivot
    denom=1-(np.cos(elevation)*h+np.sin(elevation)*vertical)/distance
    return (-s*x-c*z)/denom, (np.cos(elevation)*vertical-np.sin(elevation)*h)/denom


def proxy(length,width,height,wb):
    # Only used for initial camera calibration. The actual surface comes from silhouettes.
    cap=lambda a,lo,hi: np.clip(a,lo,hi)
    stations=np.linspace(-length/2,length/2,51)
    surface=[]
    for x in stations:
        t=x/length
        wide=width*.5*(1-.14*abs(2*t)**7)
        upper=height*(.66-.06*max(2*t,0)**2)
        lid=height*(1-.063*(2*t)**2)
        roofMix=min(cap((t+.47)/.13,0,1),cap((.26-t)/.15,0,1))
        for side in [-1,1]:
            surface.extend([[x,upper,wide*side],[x,.37,wide*.96*side],
                            [x,upper+(lid-upper)*roofMix,side*wide*(1-.22*roofMix)]])
    for axle in [-wb/2,wb/2]:
        for side in [-1,1]:
            for a in np.linspace(0,2*np.pi,36):
                surface.append([axle+.36*np.cos(a),.36+.36*np.sin(a),side*(width/2-.04)])
    surface.extend([[length*.18,height*.72,i*(width/2+.11)] for i in [-1,1]])
    return np.asarray(surface,dtype='f')


def fill_edge(rgb, valid):
    # Extend edge colour so dipping a texel beyond a silhouette does not introduce
    # the black/white matte into the windshield and wheel outlines.
    out=rgb.copy()
    for _ in range(14):
        expanded=valid.copy()
        for a,b in [(1,0),(-1,0),(0,1),(0,-1)]:
            v=np.roll(valid,(a,b),(0,1)) & ~expanded
            out[v]=np.roll(out,(a,b),(0,1))[v]
            expanded |= v
        valid=expanded
    return out


def source_image(file):
    rgba=np.array(Image.open(file).convert('RGBA'))
    mask=rgba[:,:,3]>204
    yy,xx=np.where(mask)
    margin=4
    x0=max(0,xx.min()-margin); x1=min(rgba.shape[1],xx.max()+margin+1)
    y0=max(0,yy.min()-margin); y1=min(rgba.shape[0],yy.max()+margin+1)
    # Each projected view has its own frame calibration, so tightly crop atlas tiles.
    raw=Image.fromarray(rgba[y0:y1,x0:x1]).resize(TILE,Image.Resampling.LANCZOS)
    arr=np.asarray(raw); al=arr[:,:,3]
    mask=Image.fromarray(np.where(al>=196,255,0).astype('uint8'))
    mask=mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    filled=np.array(mask)
    # Studio glass is often translucent or masked. A row in the cabin has one
    # exterior interval, even if the opposite windows are visible through it.
    for row in filled[:int(TILE[1]*.81)]:
        on=np.flatnonzero(row)
        if len(on)>1: row[on[0]:on[-1]+1]=255
    for col in filled.T:
        on=np.flatnonzero(col)
        if len(on)>1: col[on[0]:on[-1]+1]=255
    mask=Image.fromarray(filled)
    # Soft silhouette score supplies subvoxel interpolation at the extracted boundary.
    blurred=np.asarray(mask.filter(ImageFilter.GaussianBlur(2.0)),dtype='f')/255
    yy,xx=np.where(al>204)
    bbox=np.asarray([xx.min(),xx.max(),yy.min(),yy.max()],dtype='f')
    atlas=Image.fromarray(fill_edge(arr[:,:,:3],al>16))
    return blurred,bbox,atlas


def fit(cam,cloud,bbox):
    u,v=projected(cloud,*cam)
    u0,u1=u.min(),u.max()
    v0,v1=v.min(),v.max()
    left,right,top,bottom=bbox
    sx=(right-left)/(u1-u0)
    sy=(bottom-top)/(v1-v0)
    return [float(sx),float(left-sx*u0),float(-sy),float(top+sy*v1)]


def field(points,cameras,maps,dims):
    best=np.ones(len(points),dtype='f')
    second=best.copy()
    for (cam,aff),mask in zip(cameras,maps):
        u,v=projected(points,*cam); sx,ox,sy,oy=aff
        i=np.rint(sx*u+ox).astype('i')
        j=np.rint(sy*v+oy).astype('i')
        inside=(i>=0)&(j>=0)&(i<TILE[0])&(j<TILE[1])
        quality=np.where(inside,mask[j.clip(0,TILE[1]-1),i.clip(0,TILE[0]-1)],0)
        second=np.minimum(second,np.maximum(best,quality))
        best=np.minimum(best,quality)
    # A partly transparent mirror or a single soft-shadow boundary cannot punch
    # a hole clear through a body that all the other cameras saw.
    score=(.25*best+.75*second if len(cameras)>12 else .8*best+.2*second).reshape(dims)
    return score


def surface_net(score,axes,iso=.41):
    # Place one vertex in each grid cell which crosses an isosurface. Join the
    # four adjacent cell vertices around each sign-changing lattice edge.
    inside=score>iso
    dims=np.asarray(score.shape)-1
    lo=np.minimum.reduce([score[i:i+dims[0],j:j+dims[1],k:k+dims[2]]
                         for i in (0,1) for j in (0,1) for k in (0,1)])
    hi=np.maximum.reduce([score[i:i+dims[0],j:j+dims[1],k:k+dims[2]]
                         for i in (0,1) for j in (0,1) for k in (0,1)])
    cell=np.array(np.where((lo<=iso)&(hi>iso))).T
    vertex=np.zeros((len(cell),3),'f')
    total=np.zeros(len(cell),'f')
    for axis in range(3):
        b,c=(axis+1)%3,(axis+2)%3
        for ib in (0,1):
            for ic in (0,1):
                p=cell.copy();p[:,b]+=ib;p[:,c]+=ic
                q=p.copy();q[:,axis]+=1
                aVal=score[tuple(p.T)];bVal=score[tuple(q.T)]
                hit=(aVal>iso)!=(bVal>iso)
                points=p[hit].astype('f')
                points[:,axis]+=(iso-aVal[hit])/(bVal[hit]-aVal[hit])
                vertex[hit]+=points
                total[hit]+=1
    vertex/=total[:,None]
    for axis in range(3):
        vertex[:,axis]=axes[axis][0]+vertex[:,axis]*(axes[axis][1]-axes[axis][0])
    indices=np.full(dims,-1,'i'); indices[tuple(cell.T)]=np.arange(len(cell))
    faces=[]
    for axis in range(3):
        b,c=(axis+1)%3,(axis+2)%3
        p=np.array(np.where(np.diff(inside,axis=axis))).T
        p=p[(p[:,b]>0)&(p[:,b]<dims[b])&(p[:,c]>0)&(p[:,c]<dims[c])]
        a=p.copy();a[:,b]-=1;a[:,c]-=1
        q=a.copy();q[:,b]+=1
        s=a.copy();s[:,c]+=1
        ids=np.stack([indices[tuple(t.T)] for t in [a,q,p,s]],axis=1)
        flip=~inside[tuple(p.T)]
        ids[flip]=ids[flip][:,[0,3,2,1]]
        faces.extend([ids[:,[0,1,2]],ids[:,[0,2,3]]])
    return vertex,np.vstack(faces)


def encode(array):
    return base64.b64encode(array.tobytes()).decode('ascii')


def wheel_registration(data):
    """Register the visible rims to their measured 3D centres in each camera.

    A studio turntable can adjust its framing a few pixels from one shot to the
    next. Normalized patch correlation over the machined face and dark tyre
    measures that residual, locally correcting the projected wheel arches.
    """
    image=np.asarray(Image.open(io.BytesIO(base64.b64decode(data['atlas']))).convert('L'),dtype='f')/255
    cols,rows=data['layout']; n=len(data['cameras']); w,h=TILE
    def tile(i):
        x=i%cols*w; y=i//cols*h
        return image[y:y+h,x:x+w]
    ca,el,dist,pivot=data['angles']
    front,rear,r,tz,twidth=data['wheel']
    au,av=np.meshgrid(np.linspace(-.91,.91,17),np.linspace(-.91,.91,17))
    circle=au*au+av*av<.91**2
    du,dv=au[circle],av[circle]
    shifts=np.arange(-36,37,2)
    dx,dy=np.meshgrid(shifts,shifts);dx=dx.ravel();dy=dy.ravel()
    offsets=[]
    for j,aff in enumerate(data['cameras']):
        yaw=np.deg2rad(ca+360*j/n)
        row=[]
        for which,axle in enumerate((front,rear)):
            if abs(np.sin(yaw))<.30:
                row.extend([0,0]);continue
            side=-np.sign(np.sin(yaw))
            pts=np.stack([axle+du*r,r+dv*r,np.full(len(du),side*(tz+twidth*.51))],axis=1)
            u,v=projected(pts,yaw,np.deg2rad(el),dist,pivot)
            xx=np.rint((aff[0]*u+aff[1])*w).astype('i')
            yy=np.rint((aff[2]*v+aff[3])*h).astype('i')
            observed=tile(j)[(yy[:,None]+dy[None,:]).clip(0,h-1),(xx[:,None]+dx[None,:]).clip(0,w-1)]
            observed-=observed.mean(axis=0)
            ref=tile(n+which)[np.rint((.5-dv*.5)*(h-1)).astype('i'),
                               np.rint((.5+du*side*.5)*(w-1)).astype('i')]
            ref=ref-ref.mean()
            denom=np.sqrt(np.maximum((ref@ref)*np.sum(observed*observed,axis=0),1e-6))
            score=np.sum(ref[:,None]*observed,axis=0)/denom
            score-=.07*np.sqrt(dx*dx+dy*dy)/36
            best=np.argmax(score)
            strength=np.clip((score[best]-.15)/.37,0,1)
            row.extend([round(float(dx[best]/w*strength),6),round(float(dy[best]/h*strength),6)])
        offsets.append(row)
    return offsets


def reconstruct(name):
    length,width,height,wb,angle,elev,dist=MODELS[name]
    imgs=views(name)
    axes=[np.linspace(-length*.56,length*.56,131,dtype='f'),
          np.linspace(-.075,height+.14,55,dtype='f'),
          np.linspace(-width*.62,width*.62,63,dtype='f')]
    dims=tuple(map(len,axes))
    cloud=np.stack(np.meshgrid(*axes,indexing='ij'),-1).reshape(-1,3)
    model=proxy(length,width,height,wb)
    cams=[];maps=[];textures=[];bounds=[]
    for idx,image in enumerate(imgs):
        mask,bbox,tile=source_image(image)
        camera=(np.deg2rad(angle+idx*360/len(imgs)),np.deg2rad(elev),dist,height*.48)
        cams.append((camera,fit(camera,model,bbox)))
        maps.append(mask);textures.append(tile);bounds.append(bbox)
    # First intersection estimates a family-specific outline. Refit the floating
    # principal point from the consistent outline; keep physical scale fixed.
    for _ in range(2):
        score=field(cloud,cams,maps,dims)
        score[:,axes[1]<0,:]=0
        score[[0,-1]]=0;score[:,[0,-1]]=0;score[:,:,[0,-1]]=0
        if _==0:
            coherent=cloud[score.ravel()>.46][::3]
            for i,((cam,aff),bbox) in enumerate(zip(cams,bounds)):
                u,v=projected(coherent,*cam)
                sx,ox,sy,oy=aff
                deltaX=(bbox[0]+bbox[1]-sx*(u.max()+u.min()))/2-ox
                deltaY=(bbox[2]+bbox[3]-sy*(v.max()+v.min()))/2-oy
                cams[i]=(cam,[sx,ox+.7*deltaX,sy,oy+.7*deltaY])
    # The turntables carry studio contact shadows. Remove geometry in that region;
    # the curved tyres below are rebuilt with the measured wheelbase and their
    # own photographed wheel faces, which remain circular even at grazing angles.
    left,right,radius=WHEELS[name]
    center=length*(.5-(left+right)/2)
    axles=[center+wb*.5,center-wb*.5]
    X,Y,Z=(cloud[:,i].reshape(dims) for i in range(3))
    wheelWidth=.21 if radius<.37 else .245
    tyreZ=width*.5-wheelWidth*.55
    arch=(np.minimum(np.abs(X-axles[0]),np.abs(X-axles[1]))**2+(Y-radius)**2 < (radius+.014)**2)
    score[(Y<(.163 if name=='elantra' else .211)) | (arch & (np.abs(Z)>tyreZ-wheelWidth*.76))]=0
    # Mild volumetric smoothing removes one-voxel facets before surfacing.
    smooth=score*.52
    for axis in range(3):
        smooth+=.08*(np.roll(score,1,axis)+np.roll(score,-1,axis))
    verts,faces=surface_net(smooth,axes)
    if len(verts)>=65536:raise RuntimeError('mesh exceeds index limit')
    # Use more cameras on the 36-frame rotations; the intermediate images also
    # informed the hull above. Atlas dimensions stay under WebGL's 4K minimum.
    indices=list(range(0,len(imgs),2 if len(imgs)>12 else 1))
    cols=5
    rows=(len(indices)+2+cols-1)//cols
    atlas=Image.new('RGB',(cols*TILE[0],rows*TILE[1]))
    photoCams=[]
    for j,i in enumerate(indices):
        cam,aff=cams[i]
        atlas.paste(textures[i],((j%cols)*TILE[0],(j//cols)*TILE[1]))
        photoCams.append([round(aff[0]/TILE[0],7),round(aff[1]/TILE[0],7),
                          round(aff[2]/TILE[1],7),round(aff[3]/TILE[1],7)])
    sideIdx = int(np.floor((90-angle)*len(imgs)/360+.5)) % len(imgs)
    side=Image.open(imgs[sideIdx]).convert('RGBA')
    a=np.array(side)[:,:,3]
    yy,xx=np.where(a>208); xlow,xhigh=xx.min(),xx.max()
    pixelScale=(right-left)*(xhigh-xlow)/wb
    rpx=radius*pixelScale
    for j,pct in enumerate([left,right]):
        x=xlow+pct*(xhigh-xlow)
        region=a[:,int(x-rpx*.13):int(x+rpx*.13)]>226
        feet=np.where(region)[0]
        bottom=min(yy.max(),np.max(feet))+1
        y=bottom-rpx
        wheelCrop=side.crop((round(x-rpx),round(y-rpx),round(x+rpx),round(y+rpx))).convert('RGB')
        wheelCrop=wheelCrop.resize(TILE,Image.Resampling.LANCZOS)
        cell=len(indices)+j; atlas.paste(wheelCrop,((cell%cols)*TILE[0],(cell//cols)*TILE[1]))
    webp=io.BytesIO();atlas.save(webp,format='WEBP',quality=90,method=4)
    out={'positions':encode(np.rint(verts*10000).astype('<i2')),
         'indices':encode(faces.astype('<u2')),'atlas':base64.b64encode(webp.getvalue()).decode(),
         'layout':[cols,rows], 'angles':[angle,elev,dist,height*.48],
         'cameras':photoCams, 'wheel':[round(axles[0],5),round(axles[1],5),radius,round(tyreZ,5),wheelWidth],
         'height':height, 'length':length, 'width':width}
    out['wheelOffsets']=wheel_registration(out)
    DEST.mkdir(parents=True,exist_ok=True)
    dest=DEST/(name+'.json'); dest.write_text(json.dumps(out,separators=(',',':')),encoding='utf-8')
    print(f'{name}: {len(verts)} verts, {len(faces)} triangles, {len(indices)} projectors, {dest.stat().st_size//1024} KiB',flush=True)


if __name__=='__main__':
    for name in sys.argv[1:] or MODELS:reconstruct(name)