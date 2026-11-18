import { motion } from 'framer-motion';
import { BrandMark } from '../ui/CarUI';

export function SceneLoader({ label = 'Preparing your showroom' }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-[#080c0d]">
      <div className="w-64 text-center">
        <div className="flex justify-center"><BrandMark /></div>
        <p className="mt-8 font-display text-[10px] uppercase tracking-[0.25em] text-white/40">{label}</p>
        <div className="mt-4 h-px overflow-hidden bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-hev to-phev"
            initial={{ width: '8%' }}
            animate={{ width: ['8%', '64%', '91%'] }}
            transition={{ duration: 2.4, times: [0, 0.65, 1], ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
