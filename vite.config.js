import { defineConfig } from 'vite';

// GitHub Pages serves this project from https://pipboy9000.github.io/alien-garden/,
// so all built asset URLs need that subpath prefix.
export default defineConfig({
  base: '/alien-garden/',
  build: {
    rollupOptions: {
      // Chicken Fart Engine's level loader dynamically imports entity scripts referenced
      // by name in a level JSON (e.g. Player.js) via a computed runtime URL, so Vite can't
      // discover that import through static analysis alone. Building it as its own entry
      // bundles its bare "@chickenfart/engine/..." imports into a self-contained module and
      // emits it at the exact unhashed path (entities/Player.js) that main.js's
      // world.init({ paths: { entityScripts } }) points production builds at.
      input: {
        main: 'index.html',
        'entities/Player': 'src/entities/Player.js'
      },
      output: {
        entryFileNames: (chunkInfo) => (chunkInfo.name === 'main' ? 'assets/[name]-[hash].js' : '[name].js')
      }
    }
  }
});
