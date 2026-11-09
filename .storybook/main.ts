import type { StorybookConfig } from '@storybook/nextjs-vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import tailwindcss from 'tailwindcss';
import loadConfig from 'tailwindcss/loadConfig.js';

const directory = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(directory, '..');
const appTailwind = loadConfig(resolve(root, 'tailwind.config.ts'));

const config: StorybookConfig = {
  stories: ['./stories/**/*.stories.@(ts|tsx)'],
  staticDirs: [{ from: './assets', to: '/storybook-assets' }],
  framework: { name: '@storybook/nextjs-vite', options: {} },
  core: { disableTelemetry: true },
  env: () => ({}),
  viteFinal: async (config) => {
    // No application .env files or API clients are needed by this isolated preview.
    config.envDir = directory;
    const aliases = config.resolve?.alias;
    config.resolve = {
      ...config.resolve,
      alias: [
        { find: /^@\//, replacement: resolve(root, 'src').replaceAll('\\', '/') + '/' },
        ...(Array.isArray(aliases) ? aliases : Object.entries(aliases ?? {}).map(([find, replacement]) => ({ find, replacement }))),
      ],
    };
    config.css = {
      ...config.css,
      postcss: {
        plugins: [tailwindcss({
          ...appTailwind,
          content: [
            resolve(root, 'src/**/*.{js,ts,jsx,tsx,mdx}'),
            resolve(directory, '**/*.{ts,tsx,css}'),
          ],
        })],
      },
    };
    return config;
  },
};
export default config;
