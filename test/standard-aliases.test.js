import eslint from './eslint'
import expect from 'expect'
import { endent } from '@functions'

export const it = async () => expect(
  await eslint({ 'test.js': endent`
    import { map } from '@functions'

    console.log([1, 2] |> map(x => x * 2))
  `})
).toBeTruthy()

export const timeout = 5000
