import eslint from './eslint'
import expect from 'expect'

export const it = async () => {
  expect(await eslint({ 'test.js': 'console.log()' })).toBeTruthy()
  expect(await eslint({ 'test.js': 'console.log();' })).toBeFalsy()
}

export const timeout = 10000
