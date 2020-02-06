import eslint from '../eslint'

export default async () =>
  expect(await eslint({ 'test/test.js': 'expect(1).toEqual(1)' })).toEqual('')
