import eslint from './eslint'
import expect from 'expect'

export const it = async () => {
  expect(await eslint({ 'test.js': 'export default () => console.log(\'foo\')' })).toEqual('')
  expect(await eslint({ 'test.js': 'export default function () { console.log(\'foo\') }' }))
    .toMatch('error  Prefer using arrow functions over plain functions')
}

export const timeout = 10000
