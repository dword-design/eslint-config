import eslint from '../eslint'
import { endent } from '@dword-design/functions'

export default async () => {

  expect(await eslint({
    'src/index.spec.js': endent`
      import fs from 'fs'
      console.log(fs)
    `,
  })).toMatch('\'fs\' import is restricted from being used. Please use \'fs-extra\' instead')
}
