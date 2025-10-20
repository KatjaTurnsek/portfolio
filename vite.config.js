// vite.config.js
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
        // {{asset 'assets/images/foo.webp'}}
        asset: (p) => `${base}${String(p).replace(/^\//, '')}`,

        // {{route '/work'}} or {{route './work'}}
        route: (p) => {
          const s = String(p || '');
          if (/^(https?:|mailto:|tel:|#)/i.test(s)) return s;
          const cleaned = s.replace(/^\.\//, '').replace(/^\//, '');
          return `${base}${cleaned}`;
        },

        // {{base}}
        base: () => base,
      },
    }),
  ],
});
