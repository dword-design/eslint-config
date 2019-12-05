import { endent } from '@functions'
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
  })).toBeTruthy()

  expect(await eslint({
    'package.json': endent`
      {
        "version": "1.0.0",
        "name": "foo"
      }
    `,
  })).toBeFalsy()
}

export const timeout = 5000
