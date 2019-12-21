import eslint from './eslint'
import { endent } from '@dword-design/functions'
import expect from 'expect'

export default async () => {

  expect(await eslint({
    'test.js': endent`
      export default () => {
        console.log('foo')
      }
    `,
  })).toEqual('')

  expect(await eslint({
    'test.txt': endent`
      export default () => {
          console.log('foo')
      }
    `,
  })).toMatch('You are linting ".", but all of the files matching the glob pattern "." are ignored.')
}
