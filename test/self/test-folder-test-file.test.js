import eslint from '../eslint'
import expect from 'expect'
import withLocalTmpDir from 'with-local-tmp-dir'
import { outputFile } from 'fs-extra'
import endent from 'endent'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFile('package.json', JSON.stringify({ name: 'foo' }))
  expect(eslint(endent`
    import foo from 'foo'

    console.log(foo)
  `, 'test/foo.test.js')).toBeTruthy()
})
