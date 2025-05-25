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
  works: async () => {
    await outputFiles({
      'eslint.config.js': endent`
        import { defineConfig } from 'eslint/config';
        
        import self from '..';
        
        export default defineConfig([self]);
      `,
      'babel.config.json': JSON.stringify({
        extends: '@dword-design/babel-config',
      }),
      'index.js': 'export default 1;\n',
    });

    await execaCommand('eslint .');
  },
};
