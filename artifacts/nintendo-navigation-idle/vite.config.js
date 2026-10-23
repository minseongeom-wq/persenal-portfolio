import { defineConfig } from 'vite';
import { rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
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


// Keep legacy source assets available locally, but omit them from the deployed artifact.
function excludeLegacyDeploymentAssets() {
  const files = ['video/community/community-hero.mp4', 'home-transition/home-icon.png', 'home-transition/pixel-takeover.png'];
  let output;
  return {
    name: 'exclude-legacy-deployment-assets',
    apply: 'build',
    configResolved(config) { output = resolve(config.root, config.build.outDir); },
    generateBundle(_options, bundle) {
      for (const entry of Object.values(bundle)) {
        const contents = entry.type === 'chunk' ? entry.code : typeof entry.source === 'string' ? entry.source : '';
        for (const file of files) {
          if (contents.includes(file)) throw new Error('Deployment exclusion is referenced: ' + file);
        }
      }
    },
    async closeBundle() {
      for (const file of files) {
        const target = resolve(output, file);
        if (!target.startsWith(output + sep)) throw new Error('Invalid deployment exclusion: ' + file);
        await rm(target, { force: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), pageRouteEntries(), excludeLegacyDeploymentAssets()],
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
