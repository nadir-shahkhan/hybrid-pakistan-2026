import { readFile, writeFile } from 'node:fs/promises';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

// A classic script also runs from file:// after the project ZIP is extracted.
// The hosted entry retains Vite's split bundles and lazy-loaded Three.js scenes.
const result = await build({
  configFile: false,
  base: './',
  plugins: [react()],
  logLevel: 'warn',
  build: {
    write: false,
    copyPublicDir: false,
    modulePreload: false,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      input: 'src/main.tsx',
      output: { format: 'iife', inlineDynamicImports: true },
    },
  },
});
const chunk = result.output.find((entry) => entry.type === 'chunk' && entry.isEntry);
if (!chunk) throw new Error('Local preview bundle is missing');
await writeFile('dist/assets/showroom-local.js', chunk.code);
const hosted = await readFile('dist/index.html', 'utf8');
const local = hosted
  .replace(
    /<script type="module"[^>]*><\/script>/g,
    '<script defer src="./assets/showroom-local.js"></script>',
  )
  .replace(/\s*<link rel="modulepreload"[^>]*>/g, '')
  .replace(/\s*<link[^>]*https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>/g, '')
  .replace(/<link rel="stylesheet" crossorigin/g, '<link rel="stylesheet"');
await writeFile('dist/Showroom.html', local);
