import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';

// Use env flag to decide the base path (works with cross-env in package.json)
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
        // Use this in templates for internal links: href="{{baseHref}}work"
        baseHref: base,
      },
      helpers: {
        // {{asset 'assets/images/logo.svg'}}
        asset: (p) => `${base}${String(p).replace(/^\//, '')}`,
        // {{route '/work/agilitybandits'}} → base-aware routes
        route: (p) => `${base}${String(p).replace(/^\//, '')}`,
      },
    }),
  ],
});
