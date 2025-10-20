import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';

const isGh = process.env.GH_PAGES === '1';
const base = isGh ? '/portfolio/' : '/';

export default defineConfig({
  base,
  plugins: [
    handlebars({
      partialDirectory: ['src/partials', 'src/partials/sections'],
      context: {
        site: {
          title: 'Katja Turnsek - Front-End Developer & Designer | Portfolio Website',
          description:
            'Creative front-end developer with a background in art and design. Explore a fluid, modern portfolio featuring interactive animations, custom code, and thoughtful UX — built with HTML, CSS, JavaScript, GSAP, and Vite.',
        },
        baseHref: base,
      },
      helpers: {
        asset: (p) => `${base}${String(p).replace(/^\//, '')}`,
      },
    }),
  ],
});
