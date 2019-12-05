import eslint from '../eslint'
import expect from 'expect'
import endent from 'endent'

export const it = async () => expect(
  await eslint({
    'test/foo.test.js': endent`
      import foo from 'foo'

      console.log(foo)
    `,
    'node_modules/foo/index.js': 'module.exports = 1',
    'package.json': JSON.stringify({ name: 'foo' }, undefined, 2),
  })
).toBeTruthy()

export const timeout = 5000
