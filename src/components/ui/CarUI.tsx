import type { Car } from '../../data/cars';
import { exactPrice, formatPrice } from '../../lib/carUtils';

export function Price({ price, className = '' }: { price: number; className?: string }) {
  const exact = exactPrice(price);
  return (
    <span className={className} title={exact} aria-label={`${formatPrice(price)}, exactly ${exact}`}>
      {formatPrice(price)}
    </span>
  );
}

export function TypeBadge({ type, subtle = false }: { type: Car['Type']; subtle?: boolean }) {
  const isHEV = type === 'HEV';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[10px] font-semibold tracking-[0.14em] ${
        isHEV ? 'border-hev/25 text-hev' : 'border-phev/30 text-phev'
      } ${subtle ? 'bg-transparent' : isHEV ? 'bg-hev/10' : 'bg-phev/10'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isHEV ? 'bg-hev' : 'bg-phev'}`} />
      {type}
    </span>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-lg border border-hev/30 bg-hev/10">
        <span className="font-display text-sm font-bold italic text-hev">H</span>
        <span className="absolute bottom-0 right-0 h-2 w-2 bg-phev" />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-sm font-semibold tracking-[0.08em]">HYBRID PAKISTAN</div>
          <div className="mt-1.5 text-[8px] font-medium tracking-[0.32em] text-white/35">THE 2026 EDIT</div>
        </div>
      )}
    </div>
  );
}
