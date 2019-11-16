import eslint from '../eslint'
import expect from 'expect'
import withLocalTmpDir from 'with-local-tmp-dir'
import { outputFile } from 'fs-extra'

export default () => withLocalTmpDir(__dirname, async () => {
  expect(eslint('export default 1', 'foo.test.js')).toBeTruthy()
})
