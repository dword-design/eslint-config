import eslint from './eslint'
import { endent } from '@dword-design/functions'
import expect from 'expect'

export default async () => {

  expect(await eslint({
    'test.js': endent`
      import fs from 'fs'
      console.log(fs)
    `,
  })).toMatch('\'fs\' import is restricted from being used. Please use fs-extra instead')
}
