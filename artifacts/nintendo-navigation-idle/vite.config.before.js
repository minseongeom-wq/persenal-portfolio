import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { routePaths } from './src/routes/routePaths.js';

// GitHub Pages serves files rather than rewriting SPA routes to index.html.
function pageRouteEntries() {
  return {
    name: 'page-route-entries',
    apply: 'build',
    enforce: 'post',
    // Emit route entries after Vite generates HTML. closeBundle also runs
    // after failed builds, when dist/index.html may not exist yet.
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const entry = bundle['index.html'];
        if (!entry || entry.type !== 'asset') return;
        const routes = Object.values(routePaths).flatMap(route => route.includes(':slug')
          ? ['mario', 'zelda', 'splatoon'].map(slug => route.replace(':slug', slug))
          : [route]);
        for (const route of routes.filter(route => route !== '/')) {
          this.emitFile({
            type: 'asset',
            fileName: `${route.replace(/^\/+|\/+$/g, '')}/index.html`,
            source: entry.source,
          });
        }
        // Other dynamic IDs still render through the Pages 404 fallback.
        this.emitFile({ type: 'asset', fileName: '404.html', source: entry.source });
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), pageRouteEntries()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor', test: /[\\/]node_modules[\\/]/ },
          ],
        },
      },
    },
  },
});
