import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { renameSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'src/app/share-card',
  build: {
    outDir: '../../../dist',
    emptyOutDir: false,
  },
  plugins: [
    viteSingleFile(),
    {
      name: 'rename-output',
      closeBundle() {
        const src = resolve('dist', 'index.html');
        const dest = resolve('dist', 'share-card.html');
        if (existsSync(src)) {
          renameSync(src, dest);
        }
      },
    },
  ],
});
