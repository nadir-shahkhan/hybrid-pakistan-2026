import type { BodyType, Car, CarType, Drive } from '../data/cars';
import { MAX_PRICE, MIN_PRICE } from './carUtils';

export interface Filters {
  type: 'ALL' | CarType;
  minPrice: number;
  maxPrice: number;
  drive: 'ALL' | Drive;
  seats: 'ALL' | 5 | 7;
  body: 'ALL' | BodyType;
}

export const defaultFilters: Filters = {
  type: 'ALL',
  minPrice: MIN_PRICE,
  maxPrice: MAX_PRICE,
  drive: 'ALL',
  seats: 'ALL',
  body: 'ALL',
};

export function filterCars(cars: Car[], filters: Filters): Car[] {
  return cars.filter((car) => {
    if (filters.type !== 'ALL' && car.Type !== filters.type) return false;
    if (car.PricePKR < filters.minPrice || car.PricePKR > filters.maxPrice) return false;
    if (filters.drive !== 'ALL' && car.Drive !== filters.drive) return false;
    if (filters.seats !== 'ALL' && car.Seats !== filters.seats) return false;
    if (filters.body !== 'ALL' && car.Body !== filters.body) return false;
    return true;
  });
}
