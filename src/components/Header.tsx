import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { scrollToSection } from '../lib/carUtils';
import { BrandMark } from './ui/CarUI';
import { Icon } from './ui/Icon';

const links = [
  { id: 'showroom', label: 'Showroom' },
  { id: 'lineup', label: 'Line-up' },
  { id: 'data', label: 'Data space' },
  { id: 'compare', label: 'Compare' },
];

export function Header({ compareCount }: { compareCount: number }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const navigate = (id: string) => {
    setOpen(false);
    scrollToSection(id);
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-all ${scrolled || open ? 'border-white/10 bg-[#070a0b]/90 backdrop-blur-xl' : 'border-transparent bg-transparent'}`}>
      <div className="section-shell flex h-[76px] items-center justify-between">
        <button onClick={() => navigate('showroom')} aria-label="Hybrid Pakistan 2026 home" className="shrink-0">
          <BrandMark />
        </button>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => navigate(link.id)}
              className="relative rounded-full px-4 py-2 text-xs font-medium text-white/50 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
              {link.id === 'compare' && compareCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-hev px-1 text-[8px] font-bold text-[#07110f]">{compareCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-hev shadow-[0_0_12px_#35d0b5]" />
          <span className="font-display text-[9px] tracking-[0.16em] text-white/35">30 VARIANTS • NOV 2026</span>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 md:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Toggle navigation">
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="section-shell flex flex-col py-3">
              {links.map((link) => (
                <button key={link.id} onClick={() => navigate(link.id)} className="flex items-center justify-between border-b border-white/5 py-4 text-left font-display text-lg text-white/75 last:border-0">
                  {link.label}
                  <span className="flex items-center gap-2 text-xs text-white/30">{link.id === 'compare' && compareCount > 0 ? `${compareCount} selected` : <Icon name="arrow-up-right" />}</span>
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
