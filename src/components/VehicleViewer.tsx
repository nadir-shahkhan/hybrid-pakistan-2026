import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Car } from '../data/cars';
import { mediaFor, mediaUrl } from '../data/vehicleMedia';
import { Icon } from './ui/Icon';
import { SceneLoader } from './scenes/SceneLoader';
import type { OrbitAngle } from './scenes/HeroScene';

const HeroScene = lazy(() => import('./scenes/HeroScene'));
type Props = { car: Car; orbit?: boolean; priority?: boolean; compact?: boolean };
type Mode = 'exterior' | 'spin' | 'orbit';
const cameraViews: [OrbitAngle, string][] = [
  ['three-quarter', '¾'],
  ['front', 'Front'],
  ['side', 'Side'],
  ['rear', 'Rear'],
];

export function VehicleViewer(props: Props) {
  const [mode, setMode] = useState<Mode>(() =>
    props.priority && props.orbit && new URLSearchParams(window.location.search).get('view') === 'orbit'
      ? 'orbit'
      : 'exterior',
  );
  return <Gallery key={props.car.Model} {...props} mode={mode} onMode={setMode} />;
}

function Gallery({
  car,
  orbit = false,
  priority = false,
  compact = false,
  mode,
  onMode,
}: Props & { mode: Mode; onMode: (mode: Mode) => void }) {
  const media = mediaFor(car);
  const [preset, setPreset] = useState<{ angle: OrbitAngle; revision: number }>({
    angle: 'three-quarter',
    revision: 0,
  });
  const [activeAngle, setActiveAngle] = useState<OrbitAngle | null>('three-quarter');
  const [view, setView] = useState(0);
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);
  const drag = useRef<{ x: number; index: number } | null>(null);
  const spin = media?.spin;
  const actualMode = !media && orbit ? 'orbit' : mode === 'spin' && !spin?.length ? 'exterior' : mode;
  const inSpin = actualMode === 'spin' && !!spin?.length;
  const inOrbit = actualMode === 'orbit';
  const current = media?.views[view];
  const file = inSpin ? spin[frame] : current?.file;
  const count = inSpin ? spin.length : (media?.views.length ?? 0);
  const index = inSpin ? frame : view;
  useEffect(() => {
    if (!inSpin || !spin) return;
    for (const offset of [-2, -1, 1, 2]) {
      const next = new Image();
      next.src = mediaUrl(spin[(frame + offset + spin.length) % spin.length]);
    }
  }, [frame, inSpin, spin]);
  const displayIndex = (next: number) => {
    if (!count) return;
    const wrapped = ((next % count) + count) % count;
    if (inSpin) setFrame(wrapped);
    else setView(wrapped);
    setFailed(false);
  };
  const changeMode = (next: typeof mode) => {
    setFailed(false);
    onMode(next);
  };
  const pointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (inOrbit) {
      e.stopPropagation();
      return;
    }
    if (count < 2 || e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, index };
  };
  const pointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !inSpin) return;
    const stride = Math.max(7, e.currentTarget.clientWidth / (spin.length * 0.9));
    displayIndex(drag.current.index + Math.round((drag.current.x - e.clientX) / stride));
  };
  const pointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (inOrbit) {
      e.stopPropagation();
      return;
    }
    if (!drag.current) return;
    e.stopPropagation();
    const delta = drag.current.x - e.clientX;
    if (!inSpin && Math.abs(delta) > 42) displayIndex(index + Math.sign(delta));
    drag.current = null;
  };
  const location = current?.photo && !inSpin && !inOrbit;
  return (
    <figure
      className={'vehicle-viewer' + (compact ? ' viewer-compact' : '')}
      aria-label={car.Model + ' exterior viewer'}
    >
      <div
        className={
          'viewer-stage' +
          (location ? ' is-photo' : '') +
          (inOrbit ? ' is-orbit' : '') +
          (!inOrbit && count > 1 ? ' can-drag' : '')
        }
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {inOrbit ? (
          <Suspense fallback={<SceneLoader label="Opening the 3D studio" />}>
            <HeroScene car={car} preset={preset} onInspect={() => setActiveAngle(null)} />
          </Suspense>
        ) : file && !failed ? (
          <img
            className="vehicle-img"
            src={mediaUrl(file)}
            alt={car.Model + ' — ' + (inSpin ? 'manufacturer rotation view ' + (frame + 1) : current?.label)}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            draggable={false}
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="viewer-fallback">Exterior image unavailable</span>
        )}
      </div>
      <figcaption className="viewer-bar">
        <div className="viewer-modes" aria-label="View mode">
          {media && (
            <button aria-pressed={actualMode === 'exterior'} onClick={() => changeMode('exterior')}>
              Exterior
            </button>
          )}
          {spin && spin.length > 1 && (
            <button aria-pressed={inSpin} onClick={() => changeMode('spin')}>
              360°
            </button>
          )}
          {orbit && (
            <button aria-pressed={inOrbit} onClick={() => changeMode('orbit')}>
              3D orbit
            </button>
          )}
        </div>
        {inOrbit ? (
          <div className="orbit-views" aria-label="Orbit camera angles">
            {cameraViews.map(([angle, label]) => (
              <button
                key={angle}
                aria-pressed={activeAngle === angle}
                aria-label={(angle === 'three-quarter' ? 'Three-quarter' : label) + ' orbit view'}
                onClick={() => {
                  setActiveAngle(angle);
                  setPreset((p) => ({ angle, revision: p.revision + 1 }));
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="viewer-pagination">
            {count > 1 && (
              <button
                onClick={() => displayIndex(index - 1)}
                aria-label={'Previous exterior angle of ' + car.Model}
              >
                <Icon name="arrow-left" size={15} />
              </button>
            )}
            <span className="viewer-caption" aria-live={inSpin ? 'off' : 'polite'}>
              {inSpin ? 'Drag · ' + (frame + 1) + ' / ' + count : current?.label}
            </span>
            {count > 1 && (
              <button
                onClick={() => displayIndex(index + 1)}
                aria-label={'Next exterior angle of ' + car.Model}
              >
                <Icon name="arrow-right" size={15} />
              </button>
            )}
          </div>
        )}
      </figcaption>
    </figure>
  );
}

export function VehicleThumbnail({ car }: { car: Car }) {
  const first = mediaFor(car)?.views[0];
  return first ? (
    <img
      className="vehicle-thumb"
      src={mediaUrl(first.file)}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  ) : null;
}
