import eslint from './eslint'
import expect from 'expect'

export const it = async () => expect(
  await eslint({
    'foo.test.js': 'export default 1',
    'package.json': JSON.stringify({}),
  })
).toBeTruthy()

export const timeout = 5000
