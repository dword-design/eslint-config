import eslint from '../eslint'
import { endent } from '@functions'
import expect from 'expect'

export const it = async () => expect(
  await eslint({
    'test.txt': endent`
      export default () => {
          console.log('foo')
      }
    `,
  })
).toBeFalsy()

export const timeout = 5000
