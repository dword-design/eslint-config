import eslint from './eslint'
import { endent } from '@dword-design/functions'

export default async () =>
  expect(await eslint({
    'test.js': endent`
    const Foo = <div>Hello world</div>
    export default <div><Foo/></div>
  `,
  })).toEqual('')
