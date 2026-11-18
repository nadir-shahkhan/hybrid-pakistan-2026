import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Car } from '../../data/cars';
import { buildVehicle, disposeVehicle } from './vehicleGeometry';
import { applyVehicleSkins } from './vehicleSkins';
import {
  hasSpinReconstruction,
  loadSpinReconstruction,
  disposeSpinReconstruction,
} from './spinReconstruction';
import { useSceneQuality } from './SceneQuality';

export type OrbitModelKind = 'fitted' | 'reconstruction' | 'fallback';
export function ProceduralCar({
  car,
  simplified = false,
  onReady,
}: {
  car: Car;
  simplified?: boolean;
  onReady?: (kind: OrbitModelKind) => void;
}) {
  const { lowPower } = useSceneQuality();
  const group = useMemo(() => new THREE.Group(), []);
  const generation = useRef(0);

  useEffect(() => {
    const revision = ++generation.current;
    const reconstruct = !simplified && hasSpinReconstruction(car);
    const showPanels = !simplified && !reconstruct;
    const base = buildVehicle(car, simplified || lowPower, showPanels);
    if (showPanels) applyVehicleSkins(base, car);
    group.add(base);
    let detailed: THREE.Group | undefined;
    if (reconstruct) {
      loadSpinReconstruction(car)
        .then((result) => {
          if (generation.current !== revision) {
            disposeSpinReconstruction(result);
            return;
          }
          detailed = result;
          base.visible = false;
          group.add(result);
          onReady?.('reconstruction');
        })
        .catch(() => {
          if (generation.current === revision) onReady?.('fallback');
        });
    } else onReady?.('fitted');
    return () => {
      ++generation.current;
      group.remove(base);
      disposeVehicle(base);
      if (detailed) {
        group.remove(detailed);
        disposeSpinReconstruction(detailed);
      }
    };
  }, [group, car, simplified, lowPower, onReady]);
  return <primitive object={group} />;
}
