import eslint from '../eslint'
import endent from 'endent'

export default async () => expect(
  await eslint({
    'package.json': JSON.stringify({
      name: 'foo',
      main: 'dist/index.js',
    }, undefined, 2),
    'src/index.js': 'export default 1',
    'test/foo/foo.test.js': endent`
      import foo from 'foo'

      console.log(foo)
    `,
  }),
).toEqual('')
