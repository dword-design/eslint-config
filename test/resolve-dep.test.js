import eslint from './eslint'
import { endent } from '@dword-design/functions'
import expect from 'expect'

export default async () => {

  expect(await eslint({
    'test.js': endent`
      import resolveDep from 'resolve-dep'
      console.log(resolveDep)
    `,
  })).toMatch('\'resolve-dep\' import is restricted from being used. Please use \'matchdep\' instead')
}
