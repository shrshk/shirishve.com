// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://shirishve.com',
  trailingSlash: 'always',
  vite: {
    // Keep every script and stylesheet in its own file. The Content-Security-Policy
    // in public/_headers allows no inline scripts.
    build: { assetsInlineLimit: 0 },
  },
});
