import { AnimatePresence, motion } from 'framer-motion';
import type { Car } from '../data/cars';
import { Icon } from './ui/Icon';
import { Price, TypeBadge } from './ui/CarUI';
import { VehicleThumbnail } from './VehicleViewer';

interface ModelRailProps {
  cars: Car[];
  selected: Car;
  onSelect: (car: Car) => void;
  onOpen: (car: Car) => void;
}

export function ModelRail({ cars, selected, onSelect, onOpen }: ModelRailProps) {
  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="eyebrow">Model index</span>
        <span className="text-[9px] text-white/25">Swipe to browse • arrow for details</span>
      </div>
      {cars.length > 0 ? (
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-3">
          <AnimatePresence initial={false} mode="popLayout">
            {cars.map((car) => {
              const isSelected = car.Model === selected.Model;
              return (
                <motion.article
                  layout
                  key={car.Model}
                  data-car-model={car.Model}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.22 }}
                  className={`group relative w-[235px] shrink-0 snap-start rounded-xl border p-4 transition-colors sm:w-[260px] ${isSelected ? 'border-hev/45 bg-hev/[0.065]' : 'border-white/10 bg-[#0d1214] hover:border-white/20'}`}
                >
                  <button onClick={() => onSelect(car)} className="w-full text-left" aria-pressed={isSelected} aria-label={`Show ${car.Model} in the showroom`}>
                    <div className="thumb-stage"><VehicleThumbnail car={car}/></div>
                    <div className="flex items-center justify-between"><TypeBadge type={car.Type} subtle /><span className="text-[9px] text-white/25">{car.Body}</span></div>
                    <h3 className="mt-4 min-h-10 font-display text-sm font-medium leading-5 text-white/85">{car.Model}</h3>
                    <Price price={car.PricePKR} className="mt-2 block text-xs text-white/40" />
                  </button>
                  <button onClick={() => onOpen(car)} className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/35 transition hover:border-hev/50 hover:text-hev" aria-label={`Open details for ${car.Model}`} data-detail-for={car.Model}>
                    <Icon name="arrow-up-right" size={14} />
                  </button>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-xs text-white/35">No models match these filters. Reset the filters to see the full line-up.</div>
      )}
    </div>
  );
}
