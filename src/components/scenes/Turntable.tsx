import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { Car } from '../../data/cars';
import { ProceduralCar } from './ProceduralCar';

interface TurntableProps {
  car: Car;
  scale?: number;
  speed?: number;
}

const platformTopY = -0.01;

export function Turntable({ car, scale = 1, speed = 0.16 }: TurntableProps) {
  const rotating = useRef<THREE.Group>(null);
  const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useFrame((_, delta) => {
    if (rotating.current && animate) rotating.current.rotation.y += Math.min(delta, 0.05) * speed * 0.5;
  });

  return (
    <group scale={scale}>
      <mesh position-y={platformTopY - 0.13} receiveShadow>
        <cylinderGeometry args={[3.05, 3.18, 0.26, 48]} />
        <meshStandardMaterial color="#11191b" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position-y={0.005}>
        <torusGeometry args={[2.94, 0.015, 6, 64]} />
        <meshBasicMaterial color={car.Type === 'HEV' ? '#35d0b5' : '#4385ff'} transparent opacity={0.75} />
      </mesh>
      <group ref={rotating} position-y={platformTopY}>
        <ProceduralCar car={car} />
      </group>
    </group>
  );
}
