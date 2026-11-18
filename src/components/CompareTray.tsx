import { AnimatePresence, motion } from 'framer-motion';
import type { Car } from '../data/cars';
import { scrollToSection } from '../lib/carUtils';
import { Icon } from './ui/Icon';

interface CompareTrayProps {
  cars: Car[];
  onRemove: (car: Car) => void;
  onClear: () => void;
}

export function CompareTray({ cars, onRemove, onClear }: CompareTrayProps) {
  return (
    <AnimatePresence>
      {cars.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 30, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 30, x: '-50%' }} className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl">
          <div className="glass flex items-center gap-3 rounded-2xl p-2.5 shadow-2xl sm:rounded-full">
            <div className="hidden min-w-0 flex-1 gap-2 sm:flex">
              {cars.map((car) => (
                <span key={car.Model} className="flex min-w-0 items-center gap-1 rounded-full bg-white/5 py-1.5 pl-3 pr-1.5 text-[9px] text-white/50">
                  <span className="max-w-28 truncate">{car.Model}</span>
                  <button onClick={() => onRemove(car)} className="grid h-5 w-5 place-items-center rounded-full hover:bg-white/10 hover:text-white" aria-label={`Remove ${car.Model}`}><Icon name="close" size={11} /></button>
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1 px-2 sm:hidden"><span className="block font-display text-xs">{cars.length} of 3 selected</span><button onClick={onClear} className="mt-0.5 text-[9px] text-white/30">Clear comparison</button></div>
            <button onClick={onClear} className="hidden text-[9px] text-white/30 hover:text-white sm:block">Clear</button>
            <button onClick={() => scrollToSection('compare')} className="flex shrink-0 items-center gap-2 rounded-full bg-hev px-5 py-3 text-[10px] font-semibold text-[#07110f] transition hover:bg-white">Compare now<Icon name="arrow-up-right" size={14} /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
