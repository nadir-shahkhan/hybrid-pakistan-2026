# Hybrid Pakistan 2026

[Open the public 3D showroom](https://nadir-shahkhan.github.io/hybrid-pakistan-2026/?view=orbit). Drag a car to rotate it, scroll or pinch to zoom, and use the line-up to switch models.

A single-page showroom for the 30 HEV and PHEV variants in the supplied Pakistan November 2026 dataset. It uses manufacturer and local distributor imagery to show the actual vehicles in the line-up, specifications and comparison views. Variants with the same body can share exterior images. Each specification card links to the image reference and identifies any relevant market or trim differences.

## Open the showroom offline

Download and extract the [ready-to-run showroom ZIP](https://github.com/nadir-shahkhan/hybrid-pakistan-2026/archive/refs/heads/gh-pages.zip), then open `Showroom.html` in the extracted folder. Keep the `assets` and `cars` folders beside it. For a local source checkout, run `npm ci` and `npm run build`, then open `dist/Showroom.html`. The built showroom works offline. Manufacturer reference links open external websites.

## Explore a car

- **Exterior** shows the model’s studio renders or photographs. Swipe horizontally or use the angle buttons to browse the available views.
- **360°** appears for models with an ordered manufacturer turntable. Drag horizontally to rotate the car, or use the angle buttons to step through its frames.
- **3D orbit** lets you drag around a stationary car and scroll or pinch to zoom. The **¾**, **Front**, **Side** and **Rear** buttons reset the camera to a repeatable angle. The line-up keeps your viewing mode as you change cars.
- Ten model families use meshes reconstructed from manufacturer turntable silhouettes and photographs. The other thirteen pictured exteriors use individually fitted bodies with photographic panel surfaces. Roofs, underbodies and other areas outside the photographs are approximated. Trims that share a body can share an orbit model.
- The app shortcut opens the offline showroom directly in orbit mode. The equivalent entry is `dist/Showroom.html?view=orbit`.

## Run the development project

Use a current Node.js version compatible with Vite 7 (Node.js 20.19+ or 22.12+).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

The build checks TypeScript and writes the hosted entry to `dist/index.html`. It also generates `dist/Showroom.html` for direct opening from disk. Publish the whole `dist/` directory to serve the hosted entry.

## Update prices or specifications

Edit only [`src/data/cars.ts`](src/data/cars.ts). Components, filters, plots, and 3D scenes all read from this file.

Each row uses the same field names as the supplied CSV:

```ts
{
  Model: 'Example Model',
  Type: 'HEV',
  PricePKR: 6999000,
  FuelAvgKmL: '16–20',
  EVRangeKm: null,
  PowerHp: '154 (engine)',
  TorqueNm: '230 (engine)',
  Powertrain: '1.5L petrol + motor DHT',
  BatteryKWh: 1.83,
  Drive: 'FWD',
  Seats: 5,
  Body: 'Compact SUV',
  PriceNote: 'From 1 Oct 2026',
}
```

- Keep `PricePKR` as an unformatted number, for example `6999000`, not a string.
- Use `null` for an unlisted value. The interface displays `—`; do not substitute zero or an estimate.
- Preserve source strings such as `16–20`, `90+ (WLTP)`, `up to 100`, and `~121`. They are shown verbatim in the UI.
- Numeric parsing for visualization lives in `src/lib/carUtils.ts`. HEVs use EV range zero for plot positioning only.
- To add a new body style to the dataset and its filters, extend `BodyType` in `src/data/cars.ts`. To add a vehicle to the showroom, also follow the exterior media mapping below.

After editing, run `npm run build` to validate the data types and production output.

## Update exterior media

Store the vehicle’s optimized WebP images under `public/cars/`. Add the source page, labelled views and any applicable trim note to `src/data/asianMedia.ts`, `src/data/cheryMedia.ts` or `src/data/gwmMedia.ts`. Supply `spin` only for a complete, ordered manufacturer rotation. The mapping in `src/data/vehicleMedia.ts` uses the longest matching model name, so a distinct body such as the H6 GT can use its own images.

The fitted 3D profiles live in `src/data/exteriors.ts` and `src/data/orbitProfiles.ts`. The `scripts/` folder contains the turntable reconstruction and panel baking tools. Their outputs are included under `src/assets/` so a normal build can run without Python. The HR-V side surface also uses the profile on page 2 of [Honda’s HR-V product guide](https://www.honda.co.uk/content/dam/local/uk/cars/business-cars/HONDA%20HRV%20Product%20Guide%20September%202024.pdf).

## Features

- Exterior gallery, model index and optional 3D platform
- Filtered line-up with model selection and left/right keyboard navigation
- 3D price/power-or-torque/EV-range plot with labelled axes and detail-card links
- Live type, price, drive, seating, and body filters
- Up-to-three-car comparison with best-value highlighting
- Full dataset detail cards and exact PKR values on price hover
- Responsive bottom-sheet filters and reduced mobile rendering quality
- Lazy-loaded 3D scenes that pause when off-screen

## Deploy

### Vercel

1. Push this folder to a Git repository and import it in Vercel, or run `npx vercel` from the project directory.
2. Choose **Vite** as the framework if it is not detected automatically.
3. Use build command `npm run build` and output directory `dist`.
4. Deploy. No environment variables or server functions are needed.

### Netlify

1. Import the Git repository in Netlify, or run `npx netlify-cli deploy` from the project directory.
2. Use build command `npm run build` and publish directory `dist`.
3. For a production CLI deployment, run `npx netlify-cli deploy --prod --build`.
4. No environment variables or backend services are needed.

## Data disclaimer

Prices are ex-factory (exclude registration, freight, insurance) as of Nov 2026, and change often after the 2026 sales-tax revisions. Fuel averages are claimed/owner-reported ranges; EV ranges are manufacturer claims (mostly NEDC). Verify with dealers before buying.
