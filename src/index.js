import { mapValues, omitBy, values } from '@dword-design/functions'
import getPackageName from 'get-package-name'
import P from 'path'
import safeRequire from 'safe-require'

import restrictedImports from './restricted-imports.json'

const packageName = safeRequire(P.join(process.cwd(), 'package.json'))?.name
const eslintRestrictedImports =
  restrictedImports
  |> omitBy(newName => newName === packageName)
  |> mapValues((newName, oldName) => ({
    name: oldName,
    message: `Please use '${newName}' instead.`,
  }))
  |> values

export default {
  extends: [
    getPackageName(require.resolve('eslint-config-airbnb-base')),
    `plugin:${getPackageName(
      require.resolve('eslint-plugin-promise')
    )}/recommended`,
    `plugin:${getPackageName(
      require.resolve('eslint-plugin-import')
    )}/recommended`,
    `plugin:${getPackageName(
      require.resolve('@dword-design/eslint-plugin-import-alias')
    )}/recommended`,
    `plugin:${getPackageName(
      require.resolve('eslint-plugin-vue')
    )}/recommended`,
    `plugin:${getPackageName(
      require.resolve('eslint-plugin-prettier')
    )}/recommended`,
    'prettier/vue',
  ],
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
  settings: {
    'import/resolver': {
      [getPackageName(
        require.resolve('eslint-import-resolver-babel-module')
      )]: {},
    },
  },
  plugins: [
    getPackageName(require.resolve('eslint-plugin-prefer-arrow')),
    getPackageName(require.resolve('eslint-plugin-simple-import-sort')),
    getPackageName(require.resolve('eslint-plugin-json-format')),
  ],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: false,
        arrowParens: 'avoid',
      },
    ],
    'linebreak-style': ['error', 'unix'],
    'no-console': 'off',
    'import/no-dynamic-require': 'off',
    'global-require': 'off',
    'arrow-parens': ['error', 'as-needed'],
    'prefer-arrow/prefer-arrow-functions': ['error'],
    'import/no-commonjs': 'error',
    'no-regex-spaces': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: eslintRestrictedImports,
      },
    ],
    'no-template-curly-in-string': 'off',
    'import/prefer-default-export': 'off',
    'simple-import-sort/sort': 'error',
    'vue/no-v-html': 'off',
    'no-param-reassign': 'off',
    'no-nested-ternary': 'off',
    'func-names': ['error', 'never'],
    'new-cap': 'off',
    'no-underscore-dangle': 'off',
    'require-await': 'error',
    'promise/prefer-await-to-then': 'error',
    'promise/prefer-await-to-callbacks': 'error',
    'prefer-destructuring': 'off',
    'no-restricted-syntax': [
      'error',
      'ObjectPattern',
      'ArrayPattern',
      "LogicalExpression[operator='??']",
    ],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'never', prev: '*', next: '*' },
      { blankLine: 'always', prev: 'import', next: '*' },
      { blankLine: 'any', prev: 'import', next: 'import' },
      { blankLine: 'always', prev: '*', next: 'export' },
    ],
    'no-inline-comments': 'error',
    'lines-around-comment': 'error',
    'vue/require-default-prop': 'off',
    'vue/require-prop-types': 'off',
  },
  overrides: [
    {
      files: '**/*.spec.js',
      globals: {
        expect: 'readonly',
      },
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              ...eslintRestrictedImports,
              {
                name: 'expect',
                message: "Please use the global 'expect' variable instead.",
              },
            ],
          },
        ],
      },
    },
  ],
}
