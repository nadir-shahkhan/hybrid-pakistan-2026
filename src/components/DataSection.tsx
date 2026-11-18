import { lazy, Suspense, useMemo, useState } from 'react';
import type { Car } from '../data/cars';
import { numericValue } from '../lib/carUtils';
import { SceneLoader } from './scenes/SceneLoader';
import type { ScatterMetric } from './scenes/ScatterScene';
import { SectionHeading } from './ui/SectionHeading';

const ScatterScene = lazy(() => import('./scenes/ScatterScene'));

interface DataSectionProps {
  allCars: Car[];
  filteredCars: Car[];
  visibleIds: Set<string>;
  onOpen: (car: Car) => void;
}

export function DataSection({ allCars, filteredCars, visibleIds, onOpen }: DataSectionProps) {
  const [metric, setMetric] = useState<ScatterMetric>('power');
  const unplotted = useMemo(() => filteredCars.filter((car) => numericValue(metric === 'power' ? car.PowerHp : car.TorqueNm) === null), [filteredCars, metric]);
  const plottedCount = filteredCars.length - unplotted.length;

  return (
    <section id="data" className="scroll-mt-16 border-y border-white/10 bg-[#090d0f] py-20 sm:py-24">
      <div className="section-shell">
        <SectionHeading
          index="02"
          eyebrow="Price vs efficiency"
          title="See where the numbers land."
          description="Price runs left to right, performance rises vertically, and claimed electric range moves into the distance. Hover for the original specs; click any point for its complete detail card."
          aside={
            <div className="inline-flex rounded-full border border-white/10 bg-[#0d1214] p-1" aria-label="Vertical axis metric">
              {(['power', 'torque'] as const).map((value) => (
                <button key={value} onClick={() => setMetric(value)} aria-pressed={metric === value} className={`rounded-full px-4 py-2 font-display text-[10px] capitalize transition ${metric === value ? 'bg-white text-[#080c0d]' : 'text-white/40 hover:text-white'}`}>{value}</button>
              ))}
            </div>
          }
        />
        <div className="relative h-[590px] overflow-hidden rounded-2xl border border-white/10 bg-[#080c0d] sm:h-[650px]">
          <Suspense fallback={<SceneLoader label="Mapping price, power, and range" />}>
            <ScatterScene cars={allCars} visibleIds={visibleIds} metric={metric} onOpen={onOpen} />
          </Suspense>
          <div className="pointer-events-none absolute left-4 top-4 flex gap-4 rounded-full border border-white/10 bg-[#0d1214]/75 px-4 py-2.5 backdrop-blur-lg sm:left-5 sm:top-5">
            <span className="flex items-center gap-2 text-[9px] text-white/50"><span className="h-2 w-2 rounded-full bg-hev shadow-[0_0_9px_#35d0b5]" />HEV</span>
            <span className="flex items-center gap-2 text-[9px] text-white/50"><span className="h-2 w-2 rounded-full bg-phev shadow-[0_0_9px_#4385ff]" />PHEV</span>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between sm:bottom-5 sm:left-5 sm:right-5">
            <span className="font-display text-[9px] uppercase tracking-[0.15em] text-white/25">Drag to orbit • scroll to zoom<br />{plottedCount} filtered models plotted</span>
            <span className="hidden text-[9px] text-white/20 sm:block">HEV electric range = 0 for plotting only</span>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0d1214] px-4 py-3 text-[10px] leading-5 text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p><b className="font-medium text-white/55">A note on the plot:</b> ranges such as “16–20” use their midpoint; “90+”, “up to 100”, and “~90” use their stated number. HEVs use EV range 0 only on the axis. Original strings stay intact everywhere else.</p>
          {unplotted.length > 0 && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span className="text-white/25">No declared {metric}:</span>
              {unplotted.map((car) => <button key={car.Model} onClick={() => onOpen(car)} className="rounded-full border border-white/10 px-2.5 py-1 text-white/50 transition hover:border-hev/40 hover:text-hev">{car.Model}</button>)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
