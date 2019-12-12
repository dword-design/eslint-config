import { endent } from '@dword-design/functions'
import expect from 'expect'
import eslint from './eslint'

export const it = async () => {

  expect(await eslint({
    'package.json': endent`
      {
        "name": "foo",
        "version": "1.0.0"
      }
    `,
  })).toEqual('')

  expect(await eslint({
    'package.json': endent`
      {
        "version": "1.0.0",
        "name": "foo"
      }
    `,
  })).toMatch('error  JSON is not sorted')
}

export const timeout = 15000
