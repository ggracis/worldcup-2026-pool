import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

function manifestPlugin(appName: string, shortName: string): Plugin {
  const manifest = JSON.stringify({
    name: appName,
    short_name: shortName,
    description: appName,
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/app-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }, null, 2);

  return {
    name: 'generate-manifest',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.json', source: manifest });
    },
    configureServer(server) {
      server.middlewares.use('/manifest.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(manifest);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const appName = env.VITE_APP_NAME ?? 'Mundial de Fútbol 26';
  const shortName = env.VITE_APP_SHORT_NAME ?? 'Mundial 26';

  return {
    plugins: [react(), manifestPlugin(appName, shortName)],
  };
});
