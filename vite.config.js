import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';

export default defineConfig({
  // GitHub Pages project site (adjust base to your repo name)
  base: '/portfolio/',

  plugins: [
    handlebars({
      partialDirectory: [
        'src/partials', // head, header, menu, footer
        'src/partials/sections', // every <section> partial
      ],
      context: {
        site: {
          title: 'Katja Turnsek - Front-End Developer & Designer | Portfolio Website',
          description:
            'Creative front-end developer with a background in art and design. Explore a fluid, modern portfolio featuring interactive animations, custom code, and thoughtful UX — built with HTML, CSS, JavaScript, GSAP, and Vite.',
        },
        baseHref: '/portfolio/',
      },
    }),
  ],
});
