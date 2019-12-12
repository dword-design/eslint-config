import eslint from './eslint'
import { endent } from '@dword-design/functions'
import expect from 'expect'

export const it = async () => {

  expect(await eslint({
    'test.js': endent`
      export default () => {
        console.log('foo')
      }
    `,
  })).toBeTruthy()

  expect(await eslint({
    'test.txt': endent`
      export default () => {
          console.log('foo')
      }
    `,
  })).toBeFalsy()
}

export const timeout = 10000
