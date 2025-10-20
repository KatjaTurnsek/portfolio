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
        baseHref: base, // still available in templates as {{baseHref}}
      },
      helpers: {
        // For static assets: {{asset 'assets/images/foo.webp'}}
        asset: (p) => `${base}${String(p).replace(/^\//, '')}`,

        // For internal links that should honor the base path:
        // {{route '/work'}} or {{route './work'}} → '/portfolio/work' on GH, '/' or '/work' locally
        route: (p) => {
          const s = String(p || '');
          // pass through external/special links unchanged
          if (/^(https?:|mailto:|tel:|#)/i.test(s)) return s;
          const cleaned = s.replace(/^\.\//, '').replace(/^\//, '');
          return `${base}${cleaned}`;
        },

        // Optional: {{base}} → '/portfolio/' or '/'
        base: () => base,
      },
    }),
  ],
});
