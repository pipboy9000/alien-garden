import { defineConfig } from 'vite';

// GitHub Pages serves this project from https://pipboy9000.github.io/alien-garden/,
// so all built asset URLs need that subpath prefix.
export default defineConfig({
  base: '/alien-garden/'
});
