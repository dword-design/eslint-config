import eslint from '../eslint'
import expect from 'expect'
import endent from 'endent'

export const it = async () => expect(
  await eslint({
    'package.json': JSON.stringify({ name: 'foo' }, undefined, 2),
    'src/index.js': 'export default 1',
    'test/foo/foo.test.js': endent`
      import foo from 'foo'

      console.log(foo)
    `,
  })
).toBeTruthy()

export const timeout = 5000
