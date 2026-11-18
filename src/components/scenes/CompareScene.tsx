import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Car } from '../../data/cars';
import { SceneCanvas } from './SceneCanvas';
import { StudioEnvironment } from './StudioEnvironment';
import { Turntable } from './Turntable';

export default function CompareScene({ cars }: { cars: Car[] }) {
  const positions = cars.length === 1 ? [0] : cars.length === 2 ? [-3.2, 3.2] : [-5.4, 0, 5.4];
  return (
    <SceneCanvas
      camera={{ position: [0, 6.4, cars.length === 3 ? 16.8 : 14], fov: 40, near: 0.1, far: 100 }}
      label={`3D comparison of ${cars.map((car) => car.Model).join(', ')}`}
    >
      <StudioEnvironment />
      <FitComparison count={cars.length}/>
      {cars.map((car, index) => (
        <group key={car.Model} position={[positions[index], 0, 0]}>
          <Turntable car={car} scale={0.76} speed={0.12 + index * 0.025} />
          <ModelLabel model={car.Model}/>
        </group>
      ))}
      <OrbitControls
        makeDefault
        enableDamping
        enablePan={false}
        minDistance={10}
        maxDistance={50}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.48}
        target={[0, 0.7, 0]}
      />
    </SceneCanvas>
  );
}

function ModelLabel({model}:{model:string}) {
  const {texture, aspect} = useMemo(()=>{
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const font = '500 28px Arial, sans-serif';
    context.font = font;
    canvas.width = Math.ceil(context.measureText(model).width)+40;
    canvas.height = 54;
    context.fillStyle = '#172023';
    context.beginPath();
    context.roundRect(0,0,canvas.width,canvas.height,canvas.height/2);
    context.fill();
    context.font = font;
    context.fillStyle = '#f1f6f5';
    context.textBaseline = 'middle';
    context.fillText(model,20,canvas.height/2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return {texture, aspect:canvas.width/canvas.height};
  },[model]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <sprite position={[0,2.1,0]} scale={[aspect*.34,.34,1]} renderOrder={2}>
    <spriteMaterial map={texture} transparent depthWrite={false} depthTest={false} toneMapped={false}/>
  </sprite>;
}

function FitComparison({count}:{count:number}) {
  const { camera, size } = useThree();
  useEffect(()=>{
    const halfWidth = count===3 ? 8.4 : count===2 ? 6.2 : 3.3;
    const distance = Math.max(10.5, halfWidth / (Math.tan(Math.PI/9) * size.width / Math.max(1,size.height)));
    camera.position.set(0, .7+distance*.32, distance);
    camera.lookAt(0,.7,0);
    camera.updateProjectionMatrix();
  },[camera,count,size.width,size.height]);
  return null;
}
