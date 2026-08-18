import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { projects } from '../src/data/projects.js';

const distDir = path.resolve('dist');
const entryFile = path.join(distDir, 'index.html');

const baseRoutes = ['about', 'work', 'services', 'contact', 'thank-you'];

const projectRoutes = projects
  .map(({ routeUrl }) => routeUrl?.replace(/^\/+|\/+$/g, ''))
  .filter(Boolean);

const routes = [...new Set([...baseRoutes, ...projectRoutes])];

await Promise.all(
  routes.map(async (route) => {
    const targetDir = path.join(distDir, route);

    await mkdir(targetDir, { recursive: true });
    await copyFile(entryFile, path.join(targetDir, 'index.html'));
  })
);
