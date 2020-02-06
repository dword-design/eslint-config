import eslint from '../eslint'
import expect from 'expect'

export default async () =>
  expect(await eslint({ 'test/test.js': 'expect(1).toEqual(1)' })).toEqual('')
