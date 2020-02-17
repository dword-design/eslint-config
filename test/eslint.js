import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'

export default (files, { nodeEnv } = {}) => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    ...files,
    '.eslintrc.json': JSON.stringify({ extends: '@dword-design' }),
  })
  try {
    await spawn(
      'eslint',
      ['--ext', '.js,.json', '.'],
      { capture: ['stderr', 'stdout'], env: { ...process.env, NODE_ENV: nodeEnv } },
    )
    return ''
  } catch (error) {
    return `${error.stderr}${error.stdout}`
  }
})
