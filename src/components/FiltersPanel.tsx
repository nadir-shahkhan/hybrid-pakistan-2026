import { cars } from '../data/cars';
import type { BodyType, CarType, Drive } from '../data/cars';
import { formatPrice, MAX_PRICE, MIN_PRICE } from '../lib/carUtils';
import type { Filters } from '../lib/filters';
import { Icon } from './ui/Icon';

interface FiltersPanelProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  resultCount: number;
  idPrefix?: string;
}

const bodyTypes = Array.from(new Set(cars.map((car) => car.Body)));

export function FiltersPanel({ filters, onChange, onReset, resultCount, idPrefix = 'desktop' }: FiltersPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Refine the line-up</span>
          <p className="mt-2 font-display text-sm text-white/75">{resultCount} of 30 in view</p>
        </div>
        <button onClick={onReset} className="text-[10px] font-medium text-white/35 underline decoration-white/20 underline-offset-4 transition hover:text-hev">Reset all</button>
      </div>
      <FilterGroup label="Powertrain type">
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'HEV', 'PHEV'] as const).map((type) => (
            <FilterChip key={type} active={filters.type === type} onClick={() => onChange({ type: type as 'ALL' | CarType })} label={type === 'ALL' ? 'All types' : type} />
          ))}
        </div>
      </FilterGroup>
      <FilterGroup label="Price range • PKR">
        <div className="mb-4 flex items-center justify-between font-display text-xs text-white/80">
          <span title={`Rs ${filters.minPrice.toLocaleString('en-PK')}`}>{formatPrice(filters.minPrice)}</span>
          <span className="text-white/20">—</span>
          <span title={`Rs ${filters.maxPrice.toLocaleString('en-PK')}`}>{formatPrice(filters.maxPrice)}</span>
        </div>
        <label htmlFor={`${idPrefix}-min-price`} className="mb-2 block text-[9px] uppercase tracking-wider text-white/30">Minimum</label>
        <input
          id={`${idPrefix}-min-price`}
          className="range-input"
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={100000}
          value={filters.minPrice}
          onChange={(event) => onChange({ minPrice: Math.min(Number(event.target.value), filters.maxPrice) })}
          aria-valuetext={formatPrice(filters.minPrice)}
        />
        <label htmlFor={`${idPrefix}-max-price`} className="mb-2 mt-5 block text-[9px] uppercase tracking-wider text-white/30">Maximum</label>
        <input
          id={`${idPrefix}-max-price`}
          className="range-input"
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={100000}
          value={filters.maxPrice}
          onChange={(event) => onChange({ maxPrice: Math.max(Number(event.target.value), filters.minPrice) })}
          aria-valuetext={formatPrice(filters.maxPrice)}
        />
      </FilterGroup>
      <FilterGroup label="Drive">
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'FWD', 'AWD', '4WD'] as const).map((drive) => (
            <FilterChip key={drive} active={filters.drive === drive} onClick={() => onChange({ drive: drive as 'ALL' | Drive })} label={drive === 'ALL' ? 'Any drive' : drive} />
          ))}
        </div>
      </FilterGroup>
      <FilterGroup label="Seats">
        <div className="flex flex-wrap gap-2">
          {(['ALL', 5, 7] as const).map((seats) => (
            <FilterChip key={seats} active={filters.seats === seats} onClick={() => onChange({ seats })} label={seats === 'ALL' ? 'Any layout' : `${seats} seats`} />
          ))}
        </div>
      </FilterGroup>
      <FilterGroup label="Body type">
        <div className="relative">
          <select
            id={`${idPrefix}-body`}
            value={filters.body}
            onChange={(event) => onChange({ body: event.target.value as 'ALL' | BodyType })}
            className="w-full appearance-none rounded-xl border border-white/10 bg-[#111719] px-3 py-3 pr-9 text-xs text-white/70 outline-none transition focus:border-hev/50"
          >
            <option value="ALL">All body types</option>
            {bodyTypes.map((body) => <option key={body} value={body}>{body}</option>)}
          </select>
          <Icon name="chevron-down" size={14} className="pointer-events-none absolute right-3 top-3.5 text-white/35" />
        </div>
      </FilterGroup>
      <p className="border-t border-white/10 pt-4 text-[9px] leading-4 text-white/25">Filters update the carousel and data space together. Unlisted specs remain unknown.</p>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <fieldset><legend className="eyebrow mb-3 !text-white/35">{label}</legend>{children}</fieldset>;
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`chip ${active ? 'chip-active' : ''}`}>{label}</button>;
}
