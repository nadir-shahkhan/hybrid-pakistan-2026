import type { Car } from '../data/cars';
import { displayValue, scrollToSection } from '../lib/carUtils';
import { Price, TypeBadge } from './ui/CarUI';
import { Icon } from './ui/Icon';
import { VehicleViewer } from './VehicleViewer';

interface HeroProps {
  car: Car;
  compared: boolean;
  onOpen: (car: Car) => void;
  onCompare: (car: Car) => void;
}

export function Hero({ car, compared, onOpen, onCompare }: HeroProps) {
  return (
    <section id="showroom" className="showroom-hero border-b border-white/10">
      <div className="section-shell hero-layout">
        <div className="hero-intro">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-hev" />
            <span className="eyebrow !text-hev">Pakistan’s electrified showroom</span>
          </div>
          <h1 className="hero-title font-display">
            Hybrid
            <br /> Pakistan<span> /26</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/60 sm:text-base">
            Explore 30 hybrids on sale in Pakistan. See the cars up close and compare the numbers side by
            side.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button
              onClick={() => scrollToSection('lineup')}
              className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-xs font-semibold text-ink hover:bg-hev"
            >
              Explore the line-up <Icon name="arrow-right" size={15} />
            </button>
            <button
              onClick={() => scrollToSection('data')}
              className="flex items-center gap-1 text-xs text-white/60 hover:text-white"
            >
              Data space <Icon name="arrow-up-right" size={14} />
            </button>
          </div>
        </div>
        <article className="hero-exhibit">
          <VehicleViewer car={car} orbit priority />
          <div className="exhibit-info">
            <div className="flex items-center gap-3">
              <TypeBadge type={car.Type} />
              <span className="text-xs text-white/50">{car.Body}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-4">
              <button onClick={() => onOpen(car)} className="group text-left">
                <h2 className="font-display text-2xl font-medium leading-tight tracking-tight group-hover:text-hev">
                  {car.Model}
                </h2>
                <Price price={car.PricePKR} className="mt-1 block text-sm text-white/70" />
              </button>
              <button
                onClick={() => onCompare(car)}
                aria-pressed={compared}
                aria-label={
                  (compared ? 'Remove ' : 'Add ') +
                  car.Model +
                  (compared ? ' from comparison' : ' to comparison')
                }
                className="round-control"
              >
                <Icon name={compared ? 'check' : 'compare'} size={17} />
              </button>
            </div>
          </div>
        </article>
        <div className="hero-stats">
          <dl className="flex flex-wrap gap-x-9 gap-y-3">
            <KeyStat
              label="Fuel average"
              value={displayValue(car.FuelAvgKmL, car.FuelAvgKmL ? 'km/L' : '')}
            />
            <KeyStat label="Power" value={displayValue(car.PowerHp, car.PowerHp ? 'hp' : '')} />
            <KeyStat label="EV range" value={displayValue(car.EVRangeKm, car.EVRangeKm ? 'km' : '')} />
          </dl>
          <p className="mt-4 text-[10px] text-white/45">{car.PriceNote}</p>
        </div>
      </div>
    </section>
  );
}

function KeyStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] uppercase tracking-[.13em] text-white/45">{label}</dt>
      <dd className="mt-1.5 font-display text-sm text-white/85">{value}</dd>
    </div>
  );
}
