import eslint from '../eslint'
import { endent } from '@dword-design/functions'

export default async () => {

  expect(await eslint({
    'test.js': endent`
      import puppeteer from 'puppeteer'
      console.log(puppeteer)
    `,
  })).toMatch('\'puppeteer\' import is restricted from being used. Please use \'@dword-design/puppeteer\' instead')
}
