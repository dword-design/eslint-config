import eslint from '../eslint'
import expect from 'expect'

export const it = async () => expect(await eslint({ 'test.js': 'console.log()' })).toBeTruthy()
export const timeout = 5000
