import eslint from './eslint'
import expect from 'expect'

export default async () =>
  expect(await eslint({
    'test.js': 'export default <div>Hello world</div>',
  })).toEqual('')
