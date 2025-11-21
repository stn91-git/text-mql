// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

const port = 4324;
// https://astro.build/config
export default defineConfig({
  server: {
    host: '0.0.0.0',   // 👈 important for Docker
    port,
  },
  site: 'https://textmql-dev-app.station91.in',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // Prevent client-side bundling of server-only packages
      },
    },
  },
  adapter: node({
    mode: 'standalone'
  })
});