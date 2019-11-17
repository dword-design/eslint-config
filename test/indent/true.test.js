import eslint from '../eslint'
import { endent } from '@functions'
import expect from 'expect'

export default () => expect(
  eslint(endent`
    export default () => {
      console.log('foo')
    }
  `)
).toBeTruthy()
