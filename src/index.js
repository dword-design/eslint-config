import { getStandard as getStandardAliases, getForTests as getAliasesForTests } from '@dword-design/aliases'
import getPackageName from 'get-package-name'

export default {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: require.resolve('babel-eslint'),
  parserOptions: {
    sourceType: 'module',
    babelOptions: {
      configFile: require.resolve('@dword-design/babel-config'),
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  plugins: [
    getPackageName(require.resolve('eslint-plugin-prefer-arrow')),
    getPackageName(require.resolve('eslint-plugin-import')),
    getPackageName(require.resolve('eslint-plugin-json-format')),
  ],
  settings: {
    'import/resolver': {
      [require.resolve('eslint-import-resolver-babel-module')]: { alias: getStandardAliases() },
    },
  },
  rules: {
    indent: ['error', 2, { SwitchCase: 1 }],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'comma-dangle': ['error', 'always-multiline'],
    'arrow-parens': ['error', 'as-needed'],
    'prefer-arrow/prefer-arrow-functions': ['error'],
    'no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: false }],
    'no-var': 'error',
    'prefer-const': 'error',
    'import/no-extraneous-dependencies': 'error',
    'import/no-commonjs': 'error',
    'no-regex-spaces': 'off',
  },
  overrides: [
    {
      files: ['test/**/*.js'],
      settings: {
        'import/resolver': {
          [require.resolve('eslint-import-resolver-babel-module')]: { alias: getAliasesForTests() },
        },
      },
    },
  ],
}
