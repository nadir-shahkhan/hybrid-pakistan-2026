import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import type { Filters } from '../lib/filters';
import { FiltersPanel } from './FiltersPanel';
import { Icon } from './ui/Icon';

interface MobileFiltersProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  resultCount: number;
  raised: boolean;
}

export function MobileFilters({ open, onOpen, onClose, filters, onChange, onReset, resultCount, raised }: MobileFiltersProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', escape);
    };
  }, [open, onClose]);

  return (
    <>
      <button onClick={onOpen} className={`fixed right-4 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-[#101719]/95 px-4 py-3 text-xs font-medium shadow-2xl backdrop-blur-xl transition-[bottom] lg:hidden ${raised ? 'bottom-24' : 'bottom-5'}`}>
        <Icon name="filter" size={16} className="text-hev" />
        Filters
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/50">{resultCount}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[80] flex items-end lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} aria-label="Close filters" />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-filter-title"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="relative max-h-[88svh] w-full overflow-y-auto rounded-t-3xl border-t border-white/15 bg-[#0d1214] p-5 pb-8 shadow-2xl"
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />
              <div className="mb-6 flex items-center justify-between">
                <h2 id="mobile-filter-title" className="font-display text-2xl tracking-tight">Filter the line-up</h2>
                <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10" aria-label="Close filters"><Icon name="close" /></button>
              </div>
              <FiltersPanel filters={filters} onChange={onChange} onReset={onReset} resultCount={resultCount} idPrefix="mobile" />
              <button onClick={onClose} className="mt-7 w-full rounded-full bg-hev py-3.5 text-xs font-semibold text-[#07110f]">Show {resultCount} models</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
