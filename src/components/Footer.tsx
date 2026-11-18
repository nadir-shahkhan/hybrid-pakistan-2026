import { BrandMark } from './ui/CarUI';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#060809] pb-28 pt-12 lg:pb-12">
      <div className="section-shell">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div><BrandMark /><p className="mt-5 max-w-xs text-xs leading-5 text-white/45">An independent guide to Pakistan’s hybrid market. Vehicle images are credited in each model’s specifications.</p></div>
          <div className="max-w-3xl md:text-right">
            <span className="eyebrow">Before you visit a dealer</span>
            <p className="mt-4 text-xs leading-6 text-white/40">Prices are ex-factory (exclude registration, freight, insurance) as of Nov 2026, and change often after the 2026 sales-tax revisions. Fuel averages are claimed/owner-reported ranges; EV ranges are manufacturer claims (mostly NEDC). Verify with dealers before buying.</p>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-5 font-display text-[9px] uppercase tracking-[0.14em] text-white/20 sm:flex-row sm:items-center sm:justify-between">
          <span>Hybrid Pakistan 2026 • 30 variants</span>
          <span>Data supplied by user • Built with React + Three.js</span>
        </div>
      </div>
    </footer>
  );
}
