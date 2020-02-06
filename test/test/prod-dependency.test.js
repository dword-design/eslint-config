import eslint from '../eslint'
import { endent } from '@dword-design/functions'

export default async () => {

  expect(await eslint({
    'node_modules/foo/index.js': 'export default 1',
    'package.json': JSON.stringify({
      dependencies: {
        foo: '^1.0.0',
      },
    }, undefined, 2),
    'test/test.js': endent`
      import foo from 'foo'
      console.log(foo)
    `,
  })).toEqual('')
}
