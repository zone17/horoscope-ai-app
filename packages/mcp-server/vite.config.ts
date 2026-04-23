import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { renameSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Which MCP App to build. Set via `MCP_APP=share-card` or
 * `MCP_APP=philosopher-picker`. Defaults to share-card for backwards compat.
 */
const APP = process.env.MCP_APP || 'share-card';

const APP_ROOTS: Record<string, { root: string; outName: string }> = {
  'share-card': {
    root: 'src/app/share-card',
    outName: 'share-card.html',
  },
  'philosopher-picker': {
    root: 'src/app/philosopher-picker',
    outName: 'philosopher-picker.html',
  },
};

const config = APP_ROOTS[APP];
if (!config) {
  throw new Error(`Unknown MCP_APP: ${APP}. Known: ${Object.keys(APP_ROOTS).join(', ')}`);
}

export default defineConfig({
  root: config.root,
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
  },
  plugins: [
    viteSingleFile(),
    {
      name: 'rename-output',
      closeBundle() {
        const src = resolve(__dirname, 'dist', 'index.html');
        const dest = resolve(__dirname, 'dist', config.outName);
        if (existsSync(src)) {
          renameSync(src, dest);
        }
      },
    },
  ],
});
