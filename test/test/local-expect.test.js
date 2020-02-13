import eslint from '../eslint'

export default async () =>
  expect(await eslint({ 'src/index.spec.js': 'expect(1).toEqual(1)' })).toEqual('')
