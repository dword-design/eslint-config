import eslint from './eslint'
import { endent } from '@dword-design/functions'
import expect from 'expect'

export const it = async () => {

  expect(await eslint({
    'test.js': endent`
      import childProcess from 'child_process'
      console.log(childProcess)
    `,
  })).toMatch('\'child_process\' import is restricted from being used. Please use child-process-promise instead')
}

export const timeout = 10000