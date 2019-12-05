import { CLIEngine } from 'eslint'

export default (code, filename) => {
  const eslint = new CLIEngine()
  const result = eslint.executeOnText(code, filename)
  return result.errorCount === 0
}
