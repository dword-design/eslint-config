import eslint from '../eslint'
import expect from 'expect'
import endent from 'endent'

export const it = async () => expect(
  await eslint({
    'package.json': JSON.stringify({ name: 'foo' }, undefined, 2),
    'src/index.js': 'export default [1, 2]',
    'test/foo.js': endent`
      import foo from 'foo'
      import { map } from '@functions'

      console.log(foo |> map(x => x * 2))
    `,
  })
).toBeTruthy()

export const timeout = 5000
