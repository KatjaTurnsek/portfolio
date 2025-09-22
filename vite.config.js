import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';

export default defineConfig({
  // For your own domain at root:
  base: '/',
  // For GitHub Pages (project site), build with: GH_PAGES=1 npm run build:gh
  // base: process.env.GH_PAGES ? '/<your-repo-name>/' : '/',

  plugins: [
    handlebars({
      // NOTE: option name is `partialDirectory` (singular).
      // It can be a string or an array of folders.
      partialDirectory: [
        'src/partials', // head, header, menu, footer
        'src/partials/sections', // every <section> partial
      ],
      // Optional build-time defaults; router will override per section
      context: {
        site: {
          title: 'Katja Turnsek - Front-End Developer & Designer | Portfolio Website',
          description:
            'Creative front-end developer with a background in art and design. Explore a fluid, modern portfolio featuring interactive animations, custom code, and thoughtful UX — built with HTML, CSS, JavaScript, GSAP, and Vite.',
        },
      },
    }),
  ],
});
