import { test } from '@playwright/test';
import endent from 'endent';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';

test.beforeAll(() => execaCommand('base prepublishOnly'));

test('gitignore', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.gitignore': '/index.ts',
    'eslint.config.ts': endent`
      import { defineConfig } from 'eslint/config';

      import self from '../../src/index.ts';

      export default defineConfig([self]);
    `,
    'index.ts': 'foo',
  });

  await execaCommand(
    'eslint --ignore-pattern eslint.config.ts --no-warn-ignored .',
    { cwd },
  );
});

test('works', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'eslint.config.ts': endent`
      import { defineConfig } from 'eslint/config';

      import self from '../../src/index.ts';

      export default defineConfig([self]);
    `,
    'index.ts': 'export default 1;\n',
  });

  await execaCommand('eslint --ignore-pattern eslint.config.ts .', { cwd });
});
