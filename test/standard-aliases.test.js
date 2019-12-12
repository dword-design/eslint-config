import eslint from './eslint'
import expect from 'expect'
import { endent } from '@dword-design/functions'

export const it = async () => expect(
  await eslint({ 'test.js': endent`
    import { map } from '@dword-design/functions'

    console.log([1, 2] |> map(x => x * 2))
  `})
).toBeTruthy()

export const timeout = 5000
