import { CLIEngine } from 'eslint'
import config from '@dword-design/eslint-config'

export default code => (new CLIEngine({ baseConfig: config })).executeOnText(code).errorCount === 0
