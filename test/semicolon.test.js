import eslint from './eslint'
import expect from 'expect'

export const it = async () => {
  expect(await eslint({ 'test.js': 'console.log()' })).toEqual('')
  expect(await eslint({ 'test.js': 'console.log();' })).toMatch('error  Extra semicolon')
}

export const timeout = 10000
