import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Absolute site URL for canonical / Open Graph tags. Uses VITE_SITE_URL,
 * else Vercel's production domain, else leaves URLs relative.
 */
function siteUrlPlugin(siteUrl: string): Plugin {
  return {
    name: 'gitvanta-site-url',
    transformIndexHtml: (html) => html.replace(/__SITE_URL__/g, siteUrl),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const vercelHost = env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const siteUrl = (env.VITE_SITE_URL || (vercelHost ? `https://${vercelHost}` : '')).replace(/\/+$/, '');

  return {
    plugins: [react(), siteUrlPlugin(siteUrl)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Keep the landing page light: charts and vendor code load separately.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
