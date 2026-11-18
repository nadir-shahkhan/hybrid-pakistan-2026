import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { exteriorFor } from '../../data/exteriors';
import type { Car } from '../../data/cars';
import { SceneCanvas } from './SceneCanvas';
import { ProceduralCar } from './ProceduralCar';
import type { OrbitModelKind } from './ProceduralCar';

export type OrbitAngle = 'three-quarter' | 'front' | 'side' | 'rear';
interface OrbitProps {
  car: Car;
  preset: { angle: OrbitAngle; revision: number };
  onInspect: () => void;
}

const azimuth: Record<OrbitAngle, number> = {
  'three-quarter': -Math.PI * 0.235,
  front: 0,
  side: -Math.PI / 2,
  rear: -Math.PI,
};

export default function HeroScene(props: OrbitProps) {
  const [ready, setReady] = useState<OrbitModelKind>();
  return (
    <div className="absolute inset-0" data-orbit-model={props.car.Model} data-orbit-geometry={ready}>
      <SceneCanvas
        camera={{ position: [5, 2, -4], fov: 31, near: 0.05, far: 85 }}
        label={`Interactive 3D showroom featuring ${props.car.Model}`}
      >
        <OrbitStudio {...props} onReady={setReady} />
      </SceneCanvas>
      {ready === 'fallback' && (
        <span
          role="status"
          className="absolute bottom-2 left-3 rounded bg-black/70 px-2 py-1 text-xs text-white"
        >
          Simplified exterior
        </span>
      )}
    </div>
  );
}

function OrbitStudio({
  car,
  preset,
  onInspect,
  onReady,
}: OrbitProps & { onReady: (kind: OrbitModelKind) => void }) {
  const { camera, size } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const spec = exteriorFor(car);
  const targetY = spec.height * 0.47;

  useLayoutEffect(() => {
    const control = controls.current;
    if (!control || !size.width || !size.height) return;
    const yaw = azimuth[preset.angle];
    const pitch = ((preset.angle === 'three-quarter' ? 9 : 4) * Math.PI) / 180;
    const aspect = size.width / size.height;
    // Leave room for the full side profile when orbiting away from the preset.
    const halfHeight = Math.max(spec.height * 0.61, (spec.length * 0.57) / aspect);
    const distance = halfHeight / Math.tan((15.5 * Math.PI) / 180) + spec.width * 0.51;
    const horizontal = distance * Math.cos(pitch);
    control.target.set(0, targetY, 0);
    camera.position.set(
      horizontal * Math.cos(yaw),
      targetY + distance * Math.sin(pitch),
      horizontal * Math.sin(yaw),
    );
    camera.lookAt(control.target);
    control.update();
  }, [camera, preset, size.height, size.width, spec.height, spec.length, spec.width, targetY]);

  return (
    <>
      <color attach="background" args={['#dce2dd']} />
      <fog attach="fog" args={['#dce2dd', 7, 36]} />
      <hemisphereLight args={['#fffefa', '#aeb9b4', 1.35]} />
      <directionalLight position={[4, 7, -4]} intensity={1.65} color="#fff9f0" />
      <directionalLight position={[-5, 3, 3]} intensity={1.05} color="#e7f4ff" />
      <Environment resolution={128}>
        <color attach="background" args={['#989fa1']} />
        <Lightformer intensity={2.6} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[10, 3.5, 1]} />
        <Lightformer intensity={1.8} position={[0, 2.5, -5]} scale={[10, 1.3, 1]} />
        <Lightformer intensity={1.5} position={[5, 2, 0]} rotation-y={-Math.PI / 2} scale={[5, 1.5, 1]} />
      </Environment>
      <mesh position-y={-0.009} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[140, 140]} />
        <meshBasicMaterial color="#d7ded7" toneMapped={false} />
      </mesh>
      {/* Ambient occlusion beneath the chassis fades out at the axles. The
          shallow pass below uses only the geometry at the tyre contact points. */}
      <mesh position-y={-0.006} rotation-x={-Math.PI / 2} renderOrder={1}>
        <planeGeometry args={[spec.wheelbase * 1.16, spec.width * 1.08]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          toneMapped={false}
          vertexShader={`varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`}
          fragmentShader={`varying vec2 vUv;
            void main() {
              vec2 p = pow(abs(vUv * 2.0 - 1.0), vec2(3.0));
              float opacity = 0.21 * (1.0 - smoothstep(0.08, 1.0, p.x + p.y));
              gl_FragColor = vec4(0.045, 0.055, 0.05, opacity);
              #include <colorspace_fragment>
            }`}
        />
      </mesh>
      <ContactShadows
        position={[0, -0.002, 0]}
        opacity={0.76}
        scale={spec.length + 0.6}
        blur={0.55}
        far={0.11}
        resolution={256}
        renderOrder={2}
      />
      <ProceduralCar car={car} onReady={onReady} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        minDistance={2.7}
        maxDistance={19}
        minPolarAngle={Math.PI * 0.08}
        maxPolarAngle={Math.PI * 0.49}
        target={[0, targetY, 0]}
        onStart={onInspect}
      />
    </>
  );
}
