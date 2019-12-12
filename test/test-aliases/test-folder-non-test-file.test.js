import eslint from '../eslint'
import expect from 'expect'
import endent from 'endent'

export const it = async () => expect(
  await eslint({
    'package.json': JSON.stringify({
      name: 'foo',
      dependencies: {
        '@dword-design/functions': '^1.0.0',
      },
    }, undefined, 2),
    'src/index.js': 'export default [1, 2]',
    'test/foo.js': endent`
      import foo from 'foo'
      import { map } from '@dword-design/functions'

      console.log(foo |> map(x => x * 2))
    `,
  })
).toEqual('')

export const timeout = 5000
