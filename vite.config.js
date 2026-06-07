import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// base = sottopercorso del progetto su GitHub Pages.
// Se la repo si chiama diversamente da 'ttrpg-core', aggiorna qui.
export default defineConfig({
  base: '/ttrpg-core/',
  plugins: [vue()],
});
