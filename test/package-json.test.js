import { endent } from '@functions'
import expect from 'expect'
import eslint from './eslint'

export default () => {

  expect(eslint(endent`
    {
      "name": "foo",
      "version": "1.0.0"
    }
  `, 'package.json')).toBeTruthy()

  expect(eslint(endent`
    {
      "version": "1.0.0",
      "name": "foo"
    }
  `, 'package.json')).toBeFalsy()
}

