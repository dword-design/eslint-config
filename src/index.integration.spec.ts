import { test } from '@playwright/test';
import dedent from 'dedent';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';

test.beforeAll(() => execaCommand('base prepublishOnly'));

test('gitignore', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.gitignore': '/index.js',
    'eslint.config.js': dedent`
      import { defineConfig } from 'eslint/config';

      import self from '../src/index.js';

      export default defineConfig([self]);
    `,
    'index.js': 'foo',
  });

  await execaCommand('eslint --ignore-pattern eslint.config.js .', { cwd });
});

test('works', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'eslint.config.js': dedent`
      import { defineConfig } from 'eslint/config';

      import self from '../src/index.js';

      export default defineConfig([self]);
    `,
    'index.js': 'export default 1;\n',
  });

  await execaCommand('eslint --ignore-pattern eslint.config.js .', { cwd });
});
