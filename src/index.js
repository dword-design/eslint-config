import { join } from 'path'
import aliases from '@dword-design/aliases'
import safeRequire from 'safe-require'
import getPackageName from 'get-package-name'

const packageName = (safeRequire(join(process.cwd(), 'package.json')) || {}).name

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
  ],
  settings: {
    'import/resolver': {
      [require.resolve('eslint-import-resolver-babel-module')]: { alias: aliases },
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
  ...packageName !== undefined
    ? {
      overrides: [
        {
          files: ['*.test.js'],
          settings: { 'import/core-modules': [packageName] },
        },
      ],
    }
    : {},
}
