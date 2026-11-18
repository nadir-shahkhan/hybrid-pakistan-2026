import { Canvas } from '@react-three/fiber';
import type { CanvasProps } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { useInView } from 'framer-motion';
import { Component, Suspense, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as THREE from 'three';
import { useDeviceQuality } from '../../hooks/useDeviceQuality';
import { SceneQualityContext } from './SceneQuality';

interface SceneCanvasProps {
  children: ReactNode;
  camera: CanvasProps['camera'];
  className?: string;
  label: string;
}

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <p role="status" className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-white/65">This 3D view needs WebGL. Exterior images and specifications are available in the showroom.</p>
      : this.props.children;
  }
}

export function SceneCanvas({ children, camera, className = '', label }: SceneCanvasProps) {
  const container = useRef<HTMLDivElement>(null);
  const inView = useInView(container, { margin: '250px' });
  const visited = useInView(container, { once: true, margin: '250px' });
  const { lowPower } = useDeviceQuality();
  const [dpr, setDpr] = useState<number | [number, number]>(lowPower ? 1 : [1, 1.6]);

  return (
    <div ref={container} className={`absolute inset-0 ${className}`} aria-label={label}>
      {visited && <CanvasBoundary><Canvas
        camera={camera}
        dpr={dpr}
        frameloop={inView ? 'always' : 'never'}
        shadows={!lowPower}
        gl={{
          antialias: !lowPower,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <AdaptiveDpr />
        <SceneQualityContext.Provider value={{ lowPower }}>
          <Suspense fallback={null}>{children}</Suspense>
        </SceneQualityContext.Provider>
      </Canvas></CanvasBoundary>}
    </div>
  );
}
