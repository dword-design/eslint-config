import eslint from '../eslint'
import expect from 'expect'
import endent from 'endent'

export const it = async () => expect(
  await eslint({
    'foo.test.js': endent`
      import foo from 'foo'

      console.log(foo)
    `,
    'package.json': JSON.stringify({ name: 'foo' }),
  })
).toMatch('Unable to resolve path to module \'foo\'')

export const timeout = 5000
