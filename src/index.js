import getPackageName from 'get-package-name'
import safeRequire from 'safe-require'
import P from 'path'

const packageName = safeRequire(P.join(process.cwd(), 'package.json'))?.name

const restrictedImports = [
  { name: 'child_process', message: 'Please use \'execa\' instead.' },
  { name: 'child-process-promise', message: 'Please use \'execa\' instead.' },
  { name: 'fs', message: 'Please use \'fs-extra\' instead.' },
  { name: 'resolve-dep', message: 'Please use \'matchdep\' instead.' },
  ...packageName !== '@dword-design/puppeteer'
    ? [{ name: 'puppeteer', message: 'Please use \'@dword-design/puppeteer\' instead.' }]
    : [],
]

export default {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: getPackageName(require.resolve('vue-eslint-parser')),
  parserOptions: {
    parser: getPackageName(require.resolve('babel-eslint')),
    babelOptions: {
      configFile: require.resolve('@dword-design/babel-config'),
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:eslint-plugin-vue/recommended',
  ],
  plugins: [
    getPackageName(require.resolve('eslint-plugin-prefer-arrow')),
    getPackageName(require.resolve('eslint-plugin-import')),
    getPackageName(require.resolve('eslint-plugin-json-format')),
    getPackageName(require.resolve('eslint-plugin-vue')),
  ],
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
    'import/no-extraneous-dependencies': ['error', { devDependencies: false }],
    'import/no-commonjs': 'error',
    'no-regex-spaces': 'off',
    'no-restricted-imports': ['error', {
      paths: restrictedImports,
    }],
    'vue/jsx-uses-vars': 'error',
    'vue/require-default-prop': 'off',
    'vue/require-prop-types': 'off',
  },
  overrides: [
    {
      files: ['**/*.spec.js'],
      env: {
        mocha: true,
      },
      globals: {
        expect: 'readonly',
      },
      settings: {
        'import/resolver': require.resolve('./eslint-import-resolver-test'),
      },
      rules: {
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
        'no-restricted-imports': ['error', {
          paths: [
            ...restrictedImports,
            { name: 'expect', message: 'Please use the global \'expect\' variable instead.' },
          ],
        }],
      },
    },
  ],
}
