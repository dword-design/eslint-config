import { endent } from '@functions'
import expect from 'expect'
import eslint from './eslint'

export const it = async () => {

  expect(await eslint({
    'test.json': endent`
      {
        "foo": "bar",
        "bar": {
          "baz": [
            "test",
            "test2"
          ]
        }
      }
    `,
  })).toBeTruthy()

  expect(await eslint({
    'test.json': endent`
      {
        "foo":
      }
    `,
  })).toBeFalsy()

  expect(await eslint({
    'test.json': endent`
      {
      "foo": "bar"
      }
    `,
  })).toBeFalsy()

  expect(await eslint({
    'test.json': endent`
      {
          "foo": "bar"
      }
    `,
  })).toBeFalsy()
}

export const timeout = 10000
