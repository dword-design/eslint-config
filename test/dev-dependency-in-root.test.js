import eslint from './eslint'
import { endent } from '@dword-design/functions'

export default async () => expect(
  await eslint({
    'node_modules/foo/index.js': 'export default 1',
    'package.json': JSON.stringify({
      devDependencies: {
        foo: '^1.0.0',
      },
    }, undefined, 2),
    'index.js': endent`
      import foo from 'foo'
      console.log(foo)
    `,
  }),
)
  .toMatch('error  \'foo\' should be listed in the project\'s dependencies, not devDependencies')
