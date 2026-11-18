import { lazy, Suspense, useState } from 'react';
import type { ReactNode } from 'react';
import { cars as allCars } from '../data/cars';
import type { Car } from '../data/cars';
import { numericValue } from '../lib/carUtils';
import { SceneLoader } from './scenes/SceneLoader';
import { Icon } from './ui/Icon';
import { Price, TypeBadge } from './ui/CarUI';
import { SectionHeading } from './ui/SectionHeading';
import { VehicleViewer } from './VehicleViewer';

const CompareScene = lazy(() => import('./scenes/CompareScene'));

interface CompareSectionProps {
  cars: Car[];
  onAdd: (car: Car) => void;
  onRemove: (car: Car) => void;
}

interface CompareRow {
  key: string;
  label: string;
  display: (car: Car) => ReactNode;
  score?: (car: Car) => number | null;
  higherBetter?: boolean;
}

export function CompareSection({ cars, onAdd, onRemove }: CompareSectionProps) {
  const [orbit, setOrbit] = useState(false);
  const rows: CompareRow[] = [
    { key: 'price', label: 'Ex-factory price', display: (car) => <Price price={car.PricePKR} />, score: (car) => car.PricePKR },
    { key: 'fuel', label: 'Fuel average', display: (car) => car.FuelAvgKmL ? `${car.FuelAvgKmL} km/L` : '—', score: (car) => numericValue(car.FuelAvgKmL), higherBetter: true },
    { key: 'ev', label: 'EV range', display: (car) => car.EVRangeKm ? `${car.EVRangeKm} km` : '—', score: (car) => numericValue(car.EVRangeKm), higherBetter: true },
    { key: 'power', label: 'Power', display: (car) => car.PowerHp ? `${car.PowerHp} hp` : '—', score: (car) => numericValue(car.PowerHp), higherBetter: true },
    { key: 'torque', label: 'Torque', display: (car) => car.TorqueNm ? `${car.TorqueNm} Nm` : '—', score: (car) => numericValue(car.TorqueNm), higherBetter: true },
    { key: 'powertrain', label: 'Powertrain', display: (car) => car.Powertrain },
    { key: 'battery', label: 'Battery', display: (car) => car.BatteryKWh !== null ? `${car.BatteryKWh} kWh` : '—' },
    { key: 'drive', label: 'Drive', display: (car) => car.Drive ?? '—' },
    { key: 'seats', label: 'Seats', display: (car) => `${car.Seats} seats` },
    { key: 'body', label: 'Body type', display: (car) => car.Body },
    { key: 'status', label: 'Price status', display: (car) => car.PriceNote },
  ];

  const bestScores = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.score) return;
    const scores = cars.map(row.score).filter((score): score is number => score !== null);
    if (scores.length) bestScores.set(row.key, row.higherBetter ? Math.max(...scores) : Math.min(...scores));
  });

  return (
    <section id="compare" className="scroll-mt-16 py-20 sm:py-24">
      <div className="section-shell">
        <SectionHeading
          index="03"
          eyebrow="Side-by-side comparison"
          title="Your shortlist, in the round."
          description="Choose up to three variants from any detail card or carousel. Best values are highlighted using lowest price and highest performance, electric range, or fuel-average midpoint."
          aside={<span className="font-display text-xs text-white/35"><b className="mr-1 text-2xl font-medium text-white">{cars.length}</b> / 3 turntables</span>}
        />
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0d1214] p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="px-1 text-[10px] text-white/35">Add another model to the comparison</span>
          <div className="relative w-full sm:w-72">
            <select
              value=""
              onChange={(event) => {
                const car = allCars.find((item) => item.Model === event.target.value);
                if (car && !cars.some((item) => item.Model === car.Model)) onAdd(car);
              }}
              className="w-full appearance-none rounded-lg border border-white/10 bg-[#111719] px-3 py-2.5 pr-9 text-xs text-white/65 outline-none focus:border-hev/50"
              aria-label="Add a car to compare"
            >
              <option value="" disabled>Select a model…</option>
              {allCars.map((car) => <option key={car.Model} value={car.Model} disabled={cars.some((item) => item.Model === car.Model)}>{car.Model}</option>)}
            </select>
            <Icon name="chevron-down" size={14} className="pointer-events-none absolute right-3 top-3 text-white/30" />
          </div>
        </div>
        {cars.length > 0 ? (
          <>
            <div className="mb-3 flex items-center justify-end">
              <button className="chip" aria-pressed={orbit} onClick={() => setOrbit(!orbit)}>{orbit ? 'Show exterior images' : 'Show 3D turntables'}</button>
            </div>
            {orbit ? <div className="relative h-[390px] overflow-hidden rounded-2xl border border-white/10 sm:h-[460px]">
              <Suspense fallback={<SceneLoader label="Preparing your comparison" />}><CompareScene cars={cars} /></Suspense>
            </div> : <div className="comparison-photos" style={{gridTemplateColumns:'repeat('+cars.length+', minmax(min(235px, 78vw), 1fr))'}}>
              {cars.map(car=><article key={car.Model} className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1214]">
                <VehicleViewer car={car} compact/>
                <h3 className="px-4 py-3 font-display text-sm font-medium">{car.Model}</h3>
              </article>)}
            </div>}
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1214]">
              <table className="w-full min-w-[760px] border-collapse text-left" aria-label="Hybrid car specification comparison">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="w-44 p-5 align-top"><span className="eyebrow">Specification</span><span className="mt-3 block text-[9px] font-normal normal-case tracking-normal text-white/25"><i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-hev not-italic" />Best value</span></th>
                    {cars.map((car) => (
                      <th key={car.Model} className="min-w-56 p-5 align-top">
                        <div className="flex items-start justify-between gap-3"><TypeBadge type={car.Type} subtle /><button onClick={() => onRemove(car)} className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-white/30 hover:text-white" aria-label={`Remove ${car.Model} from comparison`}><Icon name="close" size={12} /></button></div>
                        <span className="mt-3 block font-display text-sm font-medium leading-5 text-white/85">{car.Model}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-b border-white/[0.065] last:border-0">
                      <th scope="row" className="p-4 pl-5 text-[10px] font-medium uppercase tracking-[0.1em] text-white/30">{row.label}</th>
                      {cars.map((car) => {
                        const score = row.score?.(car);
                        const best = score !== null && score !== undefined && bestScores.get(row.key) === score;
                        return (
                          <td key={car.Model} className={`p-4 text-xs leading-5 ${best ? 'bg-hev/[0.055] text-hev' : 'text-white/60'}`}>
                            <div className="flex items-start gap-2">
                              {best && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-hev" title="Best value in this row" />}
                              <span className={best ? 'font-medium' : ''}>{row.display(car)}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="dot-grid grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-white/15 bg-[#0a0f10] p-6 text-center">
            <div className="max-w-md">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-hev/25 bg-hev/10 text-hev"><Icon name="compare" size={24} /></div>
              <h3 className="mt-6 font-display text-2xl tracking-tight">Build your three-car shortlist.</h3>
              <p className="mt-3 text-sm leading-6 text-white/35">Use the model selector above or the compare icon on any featured car. Your turntables and specification table will appear here.</p>
              <button onClick={() => onAdd(allCars[0])} className="mt-6 rounded-full bg-white px-5 py-3 text-xs font-semibold text-[#080c0d] transition hover:bg-hev">Start with the most affordable hybrid</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
