import { endent } from '@dword-design/functions'
import eslint from '../eslint'

export default async () => expect(
  await eslint(
    {
      'package.json': endent`
        {
          "name": "foo",
          "main": "dist/index.js"
        }
      `,
      src: {
        'foo.js': endent`
          import foo from 'foo'
          
          export default foo
        `,
        'index.js': 'export default 1',
        'index.spec.js': 'expect(1).toEqual(1)',
      },
    },
    { nodeEnv: 'test' },
  ),
)
  .toEqual('')
