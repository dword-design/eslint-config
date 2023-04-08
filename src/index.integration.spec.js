import { endent } from '@dword-design/functions'
import { execaCommand } from 'execa'
import fs from 'fs-extra'
import withLocalTmpDir from 'with-local-tmp-dir'

export default {
  async afterEach() {
    await this.resetWithLocalTmpDir()
  },
  before: () => execaCommand('base prepublishOnly'),
  async beforeEach() {
    this.resetWithLocalTmpDir = await withLocalTmpDir()
  },
  works: async () => {
    await fs.outputFile(
      'index.js',
      endent`
        export default 1

      `,
    )
    await fs.outputFile(
      '.eslintrc.json',
      JSON.stringify({ extends: '..', root: true }),
    )
    await execaCommand('eslint .')
  },
}
