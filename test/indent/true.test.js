import eslint from '../eslint'
import { endent } from '@functions'
import expect from 'expect'

export const it = async () => expect(
  await eslint({
    'test.js': endent`
      export default () => {
        console.log('foo')
      }
    `,
  })
).toBeTruthy()

export const timeout = 5000
