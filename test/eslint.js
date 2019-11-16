import { CLIEngine } from 'eslint'
import importFresh from 'import-fresh'

export default (code, filename) => {
  const config = importFresh('@dword-design/eslint-config')
  const eslint = new CLIEngine({ baseConfig: config })
  const result = eslint.executeOnText(code, filename)
  return result.errorCount === 0
}
