import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        collection: resolve(__dirname, 'src/collection/collection.html'),
        // Adicionando a nova página de detalhes do jogo
        gameDetails: resolve(__dirname, 'src/details/game-details.html'),
      },
    },
  },
  server: {
    watch: {
      ignored: ['!**/node_modules/**'],
    }
  }
});
