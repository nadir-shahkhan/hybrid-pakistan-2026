import type { Car } from '../data/cars';

export const MIN_PRICE = 6_000_000;
export const MAX_PRICE = 23_000_000;

export function formatPrice(price: number): string {
  if (price >= 10_000_000) {
    return `Rs ${trimDecimal((price / 10_000_000).toFixed(2))} crore`;
  }
  return `Rs ${trimDecimal((price / 100_000).toFixed(2))} lakh`;
}

export function exactPrice(price: number): string {
  return `Rs ${price.toLocaleString('en-PK')}`;
}

function trimDecimal(value: string): string {
  return value.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export function numericValue(value: string | null): number | null {
  if (!value) return null;
  const range = value.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  const number = value.match(/\d+(?:\.\d+)?/);
  return number ? Number(number[0]) : null;
}

export function plottingEVRange(car: Car): number {
  return car.Type === 'HEV' ? 0 : numericValue(car.EVRangeKm) ?? 0;
}

export function displayValue(value: string | number | null, unit = ''): string {
  if (value === null || value === '') return '—';
  return `${value}${unit ? ` ${unit}` : ''}`;
}

export function carId(car: Car): string {
  return car.Model;
}

export function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
