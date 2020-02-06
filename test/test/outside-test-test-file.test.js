import eslint from '../eslint'
import endent from 'endent'

export default async () => expect(
  await eslint({
    'foo.test.js': endent`
      import foo from 'foo'

      console.log(foo)
    `,
    'package.json': JSON.stringify({ name: 'foo' }),
  }),
).toMatch('ENOENT: no such file or directory')
