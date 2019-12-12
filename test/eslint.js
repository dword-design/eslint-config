import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'

export default files => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    ...files,
    '.eslintrc.json': JSON.stringify({ extends: '@dword-design' }),
  })
  try {
    await spawn('eslint', ['--ext', '.js,.json', '.'])
    return true
  } catch (error) {
    return false
  }
})
