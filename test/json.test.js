import { endent } from '@dword-design/functions'
import expect from 'expect'
import eslint from './eslint'

export default async () => {

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
  })).toEqual('')

  expect(await eslint({
    'test.json': endent`
      {
        "foo":
      }
    `,
  })).toMatch('error  Unexpected token')

  expect(await eslint({
    'test.json': endent`
      {
      "foo": "bar"
      }
    `,
  })).toMatch('error  Format Error: expected "  "')

  expect(await eslint({
    'test.json': endent`
      {
          "foo": "bar"
      }
    `,
  })).toMatch('error  Format Error: unexpected "  "')
}
