import { endent } from '@functions'
import expect from 'expect'
import eslint from './eslint'

export default () => {

  expect(eslint(endent`
    {
      "foo": "bar",
      "bar": {
        "baz": [
          "test",
          "test2"
        ]
      }
    }
  `, 'test.json')).toBeTruthy()

  expect(eslint(endent`
    {
      "foo":
    }
  `, 'test.json')).toBeFalsy()

  expect(eslint(endent`
    {
    "foo": "bar"
    }
  `, 'test.json')).toBeFalsy()

  expect(eslint(endent`
    {
        "foo": "bar"
    }
  `, 'test.json')).toBeFalsy()
}

