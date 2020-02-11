import eslint from '../eslint'
import { endent } from '@dword-design/functions'

export default async () => {

  expect(await eslint({
    'node_modules/puppeteer/index.js': '',
    'package.json': endent`
      {
        "name": "@dword-design/puppeteer",
        "dependencies": {
          "puppeteer": "^1.0.0"
        }
      }
    `,
    'test.js': endent`
      import puppeteer from 'puppeteer'
      console.log(puppeteer)
    `,
  })).toEqual('')
}
