import { defineConfig } from 'vite';

// Relative asset URLs so the build works when served from a subpath,
// such as GitHub Pages at /ikigai/.
export default defineConfig({
  base: './',
});
