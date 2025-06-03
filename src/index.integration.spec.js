import dedent from 'dedent';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';
import withLocalTmpDir from 'with-local-tmp-dir';

export default {
  async afterEach() {
    await this.resetWithLocalTmpDir();
  },
  before: () => execaCommand('base prepublishOnly'),
  async beforeEach() {
    this.resetWithLocalTmpDir = await withLocalTmpDir();
  },
  gitignore: async () => {
    await outputFiles({
      '.gitignore': '/index.js',
      'babel.config.json': JSON.stringify({
        extends: '@dword-design/babel-config',
      }),
      'eslint.config.js': dedent`
        import { defineConfig } from 'eslint/config';

        import self from '../src/index.js';

        export default defineConfig([self]);
      `,
      'index.js': 'foo',
    });

    await execaCommand('eslint --ignore-pattern eslint.config.js .');
  },
  works: async () => {
    await outputFiles({
      'babel.config.json': JSON.stringify({
        extends: '@dword-design/babel-config',
      }),
      'eslint.config.js': dedent`
        import { defineConfig } from 'eslint/config';

        import self from '../src/index.js';

        export default defineConfig([self]);
      `,
      'index.js': 'export default 1;\n',
    });

    await execaCommand('eslint --ignore-pattern eslint.config.js .');
  },
};
