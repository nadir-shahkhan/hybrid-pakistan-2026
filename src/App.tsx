import { AnimatePresence, motion } from 'framer-motion';
import './showroom.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CompareSection } from './components/CompareSection';
import { CompareTray } from './components/CompareTray';
import { DataSection } from './components/DataSection';
import { DetailModal } from './components/DetailModal';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { LineupSection } from './components/LineupSection';
import { MobileFilters } from './components/MobileFilters';
import { cars } from './data/cars';
import type { Car } from './data/cars';
import { defaultFilters, filterCars } from './lib/filters';
import type { Filters } from './lib/filters';

const cheapestCar = cars.reduce((cheapest, car) => car.PricePKR < cheapest.PricePKR ? car : cheapest, cars[0]);

export default function App() {
  const [selectedModel, setSelectedModel] = useState(cheapestCar.Model);
  const [detailModel, setDetailModel] = useState<string | null>(null);
  const [compareModels, setCompareModels] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selected = cars.find((car) => car.Model === selectedModel) ?? cheapestCar;
  const detailCar = cars.find((car) => car.Model === detailModel) ?? null;
  const filteredCars = useMemo(() => filterCars(cars, filters), [filters]);
  const visibleIds = useMemo(() => new Set(filteredCars.map((car) => car.Model)), [filteredCars]);
  const compareCars = useMemo(() => compareModels.map((model) => cars.find((car) => car.Model === model)).filter((car): car is Car => Boolean(car)), [compareModels]);

  useEffect(() => {
    if (filteredCars.length > 0 && !visibleIds.has(selectedModel)) {
      setSelectedModel(filteredCars[0].Model);
    }
  }, [filteredCars, selectedModel, visibleIds]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectCar = useCallback((car: Car) => setSelectedModel(car.Model), []);
  const openDetails = useCallback((car: Car) => {
    setSelectedModel(car.Model);
    setDetailModel(car.Model);
  }, []);
  const closeDetails = useCallback(() => setDetailModel(null), []);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const updateFilters = useCallback((patch: Partial<Filters>) => setFilters((current) => ({ ...current, ...patch })), []);
  const resetFilters = useCallback(() => setFilters(defaultFilters), []);

  const toggleCompare = useCallback((car: Car) => {
    if (compareModels.includes(car.Model)) {
      setCompareModels((current) => current.filter((model) => model !== car.Model));
      return;
    }
    if (compareModels.length >= 3) {
      setToast('Three turntables are full. Remove a car before adding another.');
      return;
    }
    setCompareModels((current) => [...current, car.Model]);
    setToast(`${car.Model} added to your comparison.`);
  }, [compareModels]);

  return (
    <div className="min-h-screen bg-ink text-white">
      <a href="#lineup" className="fixed left-4 top-3 z-[120] -translate-y-20 rounded bg-hev px-4 py-2 text-xs font-semibold text-ink focus:translate-y-0">Skip to model explorer</a>
      <Header compareCount={compareCars.length} />
      <main>
        <Hero car={selected} compared={compareModels.includes(selected.Model)} onOpen={openDetails} onCompare={toggleCompare} />
        <LineupSection
          allCars={cars}
          filteredCars={filteredCars}
          visibleIds={visibleIds}
          selected={selected}
          filters={filters}
          onFilters={updateFilters}
          onReset={resetFilters}
          onSelect={selectCar}
          onOpen={openDetails}
          onCompare={toggleCompare}
          compared={compareModels.includes(selected.Model)}
        />
        <DataSection allCars={cars} filteredCars={filteredCars} visibleIds={visibleIds} onOpen={openDetails} />
        <CompareSection cars={compareCars} onAdd={toggleCompare} onRemove={toggleCompare} />
      </main>
      <Footer />
      <MobileFilters
        open={filtersOpen}
        onOpen={() => setFiltersOpen(true)}
        onClose={closeFilters}
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
        resultCount={filteredCars.length}
        raised={compareCars.length > 0}
      />
      <CompareTray cars={compareCars} onRemove={toggleCompare} onClear={() => setCompareModels([])} />
      <DetailModal car={detailCar} compared={detailCar ? compareModels.includes(detailCar.Model) : false} onClose={closeDetails} onCompare={toggleCompare} />
      <AnimatePresence>
        {toast && (
          <motion.div role="status" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="fixed left-1/2 top-24 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full border border-hev/25 bg-[#10201e]/95 px-5 py-3 text-center text-xs text-white/75 shadow-2xl backdrop-blur-xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
