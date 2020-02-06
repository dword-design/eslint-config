import eslint from './eslint'

export default async () => {
  expect(await eslint({ 'test.js': 'console.log()' })).toEqual('')
  expect(await eslint({ 'test.js': 'console.log();' })).toMatch('error  Extra semicolon')
}
