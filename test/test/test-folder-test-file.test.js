import eslint from '../eslint'
import expect from 'expect'
import endent from 'endent'

export default async () => expect(
  await eslint({
    'package.json': JSON.stringify({
      name: 'foo',
      main: 'src/index.js',
    }, undefined, 2),
    'src/index.js': 'export default 1',
    'test/foo.test.js': endent`
      import foo from 'foo'

      console.log(foo)
    `,
  }),
).toEqual('')
