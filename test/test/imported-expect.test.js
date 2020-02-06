import eslint from '../eslint'
import expect from 'expect'
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
    'test/test.js': endent`
      import expect from 'expect'

      expect(1).toEqual(1)
    `,
  })).toMatch('\'expect\' import is restricted from being used. Please use the global \'expect\' variable instead')
