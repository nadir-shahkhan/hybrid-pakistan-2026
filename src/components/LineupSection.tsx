import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Car } from '../data/cars';
import type { Filters } from '../lib/filters';
import { displayValue } from '../lib/carUtils';
import { FiltersPanel } from './FiltersPanel';
import { VehicleViewer } from './VehicleViewer';
import { ModelRail } from './ModelRail';
import { SceneLoader } from './scenes/SceneLoader';
import { Price, TypeBadge } from './ui/CarUI';
import { Icon } from './ui/Icon';
import { SectionHeading } from './ui/SectionHeading';

const CarouselScene = lazy(() => import('./scenes/CarouselScene'));

interface LineupSectionProps {
  allCars: Car[];
  filteredCars: Car[];
  visibleIds: Set<string>;
  selected: Car;
  filters: Filters;
  onFilters: (patch: Partial<Filters>) => void;
  onReset: () => void;
  onSelect: (car: Car) => void;
  onOpen: (car: Car) => void;
  onCompare: (car: Car) => void;
  compared: boolean;
}

export function LineupSection({
  allCars,
  filteredCars,
  visibleIds,
  selected,
  filters,
  onFilters,
  onReset,
  onSelect,
  onOpen,
  onCompare,
  compared,
}: LineupSectionProps) {
  const [platform, setPlatform] = useState(false);
  const section = useRef<HTMLElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const step = (direction: number) => {
    if (filteredCars.length === 0) return;
    const current = filteredCars.findIndex((car) => car.Model === selected.Model);
    const next = (Math.max(0, current) + direction + filteredCars.length) % filteredCars.length;
    onSelect(filteredCars[next]);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const target = event.target as HTMLElement;
      if (
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) ||
        target.closest('.vehicle-viewer') ||
        document.body.style.overflow === 'hidden'
      )
        return;
      const bounds = section.current?.getBoundingClientRect();
      if (!bounds || bounds.bottom < 0 || bounds.top > window.innerHeight) return;
      event.preventDefault();
      step(event.key === 'ArrowRight' ? 1 : -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) return;
    const x = event.clientX - pointerStart.current.x;
    const y = event.clientY - pointerStart.current.y;
    if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y)) step(x < 0 ? 1 : -1);
    pointerStart.current = null;
  };

  return (
    <section id="lineup" ref={section} className="scroll-mt-16 py-20 sm:py-24">
      <div className="section-shell">
        <SectionHeading
          index="01"
          eyebrow="The complete line-up"
          title="Thirty takes on hybrid."
          description="Browse exterior views with the model index or arrow keys. Open a car’s specifications to check its powertrain, price and equipment."
          aside={
            <div className="font-display text-xs text-white/35">
              <span className="text-2xl text-white">{filteredCars.length}</span> / 30 in view
              <br />
              <span className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                8 distinct body styles
              </span>
            </div>
          }
        />
        <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="hidden self-start rounded-2xl border border-white/10 bg-[#0d1214] p-5 lg:block xl:sticky xl:top-24">
            <FiltersPanel
              filters={filters}
              onChange={onFilters}
              onReset={onReset}
              resultCount={filteredCars.length}
            />
          </aside>
          <div className="min-w-0">
            <div
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1214]"
              role="region"
              aria-label="Model carousel"
            >
              {filteredCars.length > 0 && visibleIds.has(selected.Model) ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <TypeBadge type={selected.Type} />
                      {selected.Body}
                    </div>
                    <button className="chip" aria-pressed={platform} onClick={() => setPlatform(!platform)}>
                      {platform ? 'Show exterior images' : 'Show 3D platform'}
                    </button>
                  </div>
                  <div
                    className="canvas-grab"
                    onPointerDown={pointerDown}
                    onPointerUp={pointerUp}
                    onPointerCancel={() => {
                      pointerStart.current = null;
                    }}
                  >
                    {platform ? (
                      <div className="relative h-[420px] sm:h-[490px]">
                        <Suspense fallback={<SceneLoader label="Arranging the 3D platform" />}>
                          <CarouselScene
                            cars={allCars}
                            visibleIds={visibleIds}
                            selected={selected}
                            onSelect={onSelect}
                          />
                        </Suspense>
                      </div>
                    ) : (
                      <VehicleViewer car={selected} orbit />
                    )}
                  </div>
                  <div
                    className="flex flex-wrap items-end justify-between gap-4 p-5"
                    data-selected-model={selected.Model}
                  >
                    <div>
                      <h3 className="font-display text-2xl font-medium tracking-tight">{selected.Model}</h3>
                      <Price price={selected.PricePKR} className="mt-1 block text-sm text-white/65" />
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/55">
                        <span>Power {displayValue(selected.PowerHp, selected.PowerHp ? 'hp' : '')}</span>
                        <span>
                          EV range {displayValue(selected.EVRangeKm, selected.EVRangeKm ? 'km' : '')}
                        </span>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => onOpen(selected)}
                          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-hev"
                        >
                          Full specifications
                        </button>
                        <button
                          onClick={() => onCompare(selected)}
                          className="round-control"
                          aria-pressed={compared}
                          aria-label={compared ? 'Remove from comparison' : 'Add to comparison'}
                        >
                          <Icon name={compared ? 'check' : 'compare'} size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => step(-1)} className="round-control" aria-label="Previous car">
                        <Icon name="arrow-left" size={15} />
                      </button>
                      <span className="text-xs tabular-nums text-white/60">
                        {filteredCars.findIndex((car) => car.Model === selected.Model) + 1} /{' '}
                        {filteredCars.length}
                      </span>
                      <button onClick={() => step(1)} className="round-control" aria-label="Next car">
                        <Icon name="arrow-right" size={15} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center">
                  <p>No cars in this view</p>
                  <button onClick={onReset} className="mt-3 text-sm text-hev">
                    Reset filters
                  </button>
                </div>
              )}
            </div>
            <ModelRail cars={filteredCars} selected={selected} onSelect={onSelect} onOpen={onOpen} />
          </div>
        </div>
      </div>
    </section>
  );
}
