import { defineConfig, globalIgnores } from 'eslint/config';

import config from './src';

export default defineConfig([
  globalIgnores(['eslint.config.ts', 'eslint.lint-staged.config.ts']),
  config,
]);
