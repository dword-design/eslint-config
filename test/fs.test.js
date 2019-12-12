import eslint from './eslint'
import { endent } from '@dword-design/functions'
import expect from 'expect'

export const it = async () => {

  expect(await eslint({
    'test.js': endent`
      import fs from 'fs'
      console.log(fs)
    `,
  })).toMatch('\'fs\' import is restricted from being used. Please use fs-extra instead')
}

export const timeout = 10000
