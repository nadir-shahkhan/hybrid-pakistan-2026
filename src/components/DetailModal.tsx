import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { Car } from '../data/cars';
import { displayValue } from '../lib/carUtils';
import { Icon } from './ui/Icon';
import { Price, TypeBadge } from './ui/CarUI';
import { mediaFor } from '../data/vehicleMedia';
import { VehicleViewer } from './VehicleViewer';

interface DetailModalProps {
  car: Car | null;
  compared: boolean;
  onClose: () => void;
  onCompare: (car: Car) => void;
}

export function DetailModal({ car, compared, onClose, onCompare }: DetailModalProps) {
  const close = useRef<HTMLButtonElement>(null);
  const media = car && mediaFor(car);

  useEffect(() => {
    if (!car) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    close.current?.focus();
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', keydown);
      previousFocus?.focus();
    };
  }, [car, onClose]);

  return (
    <AnimatePresence>
      {car && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-center p-3 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} aria-label="Close detail card" />
          <motion.article
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="relative max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-[#0d1214] shadow-2xl"
            data-detail-model={car.Model}
          >
            <div className={`h-1 w-full ${car.Type === 'HEV' ? 'bg-hev' : 'bg-phev'}`} />
            <div className="p-5 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3"><TypeBadge type={car.Type} /><span className="eyebrow">Full specification</span></div>
                  <h2 id="detail-title" className="mt-5 max-w-xl font-display text-3xl font-medium leading-tight tracking-[-0.045em] sm:text-4xl">{car.Model}</h2>
                </div>
                <button ref={close} onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-white/50 transition hover:border-white/30 hover:text-white" aria-label="Close details"><Icon name="close" /></button>
              </div>
              <div className="detail-exterior mt-5 overflow-hidden rounded-xl border border-white/10"><VehicleViewer car={car} orbit/></div>
              {media && <p className="mt-2 text-[11px] leading-5 text-white/55">
                {media.note ?? 'Exterior shown for the model family. Wheels and equipment can vary by trim.'}{' '}
                <a className="text-hev underline underline-offset-2" href={media.source} target="_blank" rel="noreferrer">Manufacturer reference</a>
              </p>}
              <div className="mt-7 border-b border-white/10 pb-6">
                <span className="eyebrow">Ex-factory price</span>
                <Price price={car.PricePKR} className="mt-2 block font-display text-3xl font-medium tracking-tight sm:text-4xl" />
                <p className="mt-2 text-[10px] leading-5 text-white/35"><span className="mr-2 uppercase tracking-[0.13em] text-white/50">Price status</span>{car.PriceNote}</p>
              </div>
              <div className="mt-2 grid sm:grid-cols-2 sm:gap-x-8">
                <SpecRow label="Fuel average" value={displayValue(car.FuelAvgKmL, car.FuelAvgKmL ? 'km/L' : '')} />
                <SpecRow label="EV range" value={displayValue(car.EVRangeKm, car.EVRangeKm ? 'km' : '')} />
                <SpecRow label="Power" value={displayValue(car.PowerHp, car.PowerHp ? 'hp' : '')} />
                <SpecRow label="Torque" value={displayValue(car.TorqueNm, car.TorqueNm ? 'Nm' : '')} />
                <SpecRow label="Powertrain" value={car.Powertrain} wide />
                <SpecRow label="Battery" value={displayValue(car.BatteryKWh, car.BatteryKWh !== null ? 'kWh' : '')} />
                <SpecRow label="Drive" value={displayValue(car.Drive)} />
                <SpecRow label="Seats" value={`${car.Seats} seats`} />
                <SpecRow label="Body type" value={car.Body} />
                <SpecRow label="Model type" value={car.Type === 'HEV' ? 'Hybrid electric (HEV)' : 'Plug-in hybrid electric (PHEV)'} />
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => onCompare(car)} className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-xs font-semibold transition ${compared ? 'bg-hev/15 text-hev ring-1 ring-hev/40' : 'bg-white text-[#080c0d] hover:bg-hev'}`}>
                  <Icon name={compared ? 'check' : 'compare'} size={16} />{compared ? 'Remove from comparison' : 'Add to comparison'}
                </button>
                <button onClick={onClose} className="rounded-full border border-white/15 px-6 py-3.5 text-xs text-white/60 transition hover:border-white/30 hover:text-white">Back to the showroom</button>
              </div>
              <p className="mt-5 text-[9px] leading-4 text-white/25">“—” means the supplied dataset does not list a value. Hover or focus the price to see its exact PKR figure.</p>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SpecRow({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-5 border-b border-white/[0.07] py-4 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-white/30">{label}</span>
      <span className={`text-right text-xs leading-5 ${value === '—' ? 'text-white/25' : 'text-white/80'}`}>{value}</span>
    </div>
  );
}
