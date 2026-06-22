// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://IceTeaOxO.github.io',
  base: '/site',

  vite: {
    plugins: [tailwindcss()],
  },
});