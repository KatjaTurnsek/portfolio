// postcss.config.js (ESM-friendly for "type": "module")
import purgecss from '@fullhuman/postcss-purgecss';
import postcssPresetEnv from 'postcss-preset-env';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const isProd = process.env.NODE_ENV === 'production';

// PurgeCSS only in production
const purge = purgecss({
  content: ['./index.html', './src/**/*.html', './src/**/*.hbs', './src/**/*.js'],
  defaultExtractor: (content) => content.match(/[\w-/:#]+(?<!:)/g) || [],
  safelist: {
    standard: [
      // Theme & states
      'dark-theme',
      'light-theme',
      'menu-open',
      'opened',
      'no-scroll',
      'js-ready',
      'is-active',
      // Sections
      'fullscreen-section',
      'visible',
      // Loader + mini loaders
      'loader',
      'spinner',
      'wave-global',
      'simple-mini-loader',
      'fade-out',
      // Waves (static fallbacks)
      'waves-fallback',
      'top-waves',
      'menu-waves',
      // Text animation
      'wavy-line',
      'wavy-polyline',
      // Bars
      'bar-stack',
      'bar-bg',
      'bar-1',
      'bar-2',
      'bar-3',
      'bar-label',
      // Work grid
      'work-item-wrapper',
      'work-item',
      'work-link',
      'work-overlay',
      'mobile-title',
      'work-caption',
      // Pills / labels
      'project-switcher',
      'pill',
      'online-demo-label',
      'label-link',
      'label-text',
      // Icons
      'icon',
      'icon-18',
      'arrow-icon',
      // Menu/dialog
      'fullscreen-menu',
      // Blobs
      'morphing-blob-wrapper',
      'blobs',
      'blob-group',
      'blob',
    ],
    greedy: [/^case-/, /^fa-/, /^icon-/],
  },
});

export default {
  plugins: [
    postcssPresetEnv({
      stage: 1,
      features: { 'nesting-rules': true },
    }),
    autoprefixer(),
    ...(isProd ? [purge, cssnano({ preset: 'default' })] : []),
  ],
};
