import { defineConfig } from 'eslint/config';

import config from './src/index.js';

export default defineConfig([
  config,
  {
    files: ['eslint.config.js'],
    rules: { 'import/no-extraneous-dependencies': 'off' },
  },
]);
