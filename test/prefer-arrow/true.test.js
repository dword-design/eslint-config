import eslint from '../eslint'
import expect from 'expect'

export const it = async () => expect(
  await eslint({ 'test.js': 'export default () => console.log(\'foo\')' })
).toBeTruthy()

export const timeout = 5000
