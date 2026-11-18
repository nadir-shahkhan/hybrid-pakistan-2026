import type { Car } from './cars';
import { asianMedia } from './asianMedia';
import { cheryMedia } from './cheryMedia';
import { gwmMedia } from './gwmMedia';

export interface CarView {
  file: string;
  label: string;
  photo?: boolean;
}
export interface VehicleMedia {
  source: string;
  views: readonly CarView[];
  spin?: readonly string[];
  note?: string;
}
const catalogue: Record<string, VehicleMedia> = { ...asianMedia, ...cheryMedia, ...gwmMedia };
// More specific variants (such as the H6 GT) take precedence over their base family.
const families = Object.keys(catalogue).sort((a, b) => b.length - a.length);
export function mediaFor(car: Car): VehicleMedia | undefined {
  const key = families.find((prefix) => car.Model === prefix || car.Model.startsWith(prefix + ' '));
  return key ? catalogue[key] : undefined;
}
export function mediaUrl(file: string) {
  return import.meta.env.BASE_URL + file.replace(/^\/+/, '');
}
