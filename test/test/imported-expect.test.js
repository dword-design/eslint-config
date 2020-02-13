import eslint from '../eslint'
import { endent } from '@dword-design/functions'

export default async () =>
  expect(await eslint({
    'package.json': endent`
      {
        "devDependencies": {
          "expect": "^1.0.0"
        }
      }

    `,
    'src/index.spec.js': endent`
      import expect from 'expect'

      expect(1).toEqual(1)
    `,
  })).toMatch('\'expect\' import is restricted from being used. Please use the global \'expect\' variable instead')
