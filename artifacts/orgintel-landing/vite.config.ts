import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// PORT is only needed for the dev/preview server; production builds run
// without it, so default it there instead of throwing.
const isBuild = process.argv.includes('build');
const rawPort = process.env.PORT;

if (!rawPort && !isBuild) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort ?? 5173);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? '/';

// Plugin: redirect /experience/ → /experience/index.html so Vite's static
// file server resolves the public/ subdirectory index without SPA fallback.
function publicDirIndexPlugin(): import('vite').Plugin {
  return {
    name: 'public-dir-index',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/experience/' || req.url === '/experience') {
          req.url = '/experience/index.html';
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  // MPA mode: disables the SPA fallback that would serve index.html for every
  // unmatched route (e.g. /experience/), letting Vite serve public/ files directly.
  appType: 'mpa',
  plugins: [
    publicDirIndexPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
