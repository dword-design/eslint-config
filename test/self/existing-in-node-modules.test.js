import eslint from '../eslint'
import expect from 'expect'
import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import endent from 'endent'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'node_modules/foo/index.js': 'module.exports = 1',
    'package.json': JSON.stringify({ name: 'foo' }),
  })
  expect(eslint(endent`
    import foo from 'foo'

    console.log(foo)
  `, 'foo.test.js')).toBeTruthy()
})

