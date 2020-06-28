import { mapValues, omitBy, values } from '@dword-design/functions'
import getPackageName from 'get-package-name'
import loadPkg from 'load-pkg'

import restrictedImports from './restricted-imports'

const packageName = loadPkg.sync().name
const eslintRestrictedImports =
  restrictedImports
  |> omitBy(newName => newName === packageName)
  |> mapValues((newName, oldName) => ({
    message: `Please use '${newName}' instead`,
    name: oldName,
  }))
  |> values

export default {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
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
                message: "Please use the global 'expect' variable instead",
                name: 'expect',
              },
            ],
          },
        ],
      },
    },
  ],
  parser: getPackageName(require.resolve('vue-eslint-parser')),
  parserOptions: {
    babelOptions: {
      configFile: require.resolve('@dword-design/babel-config'),
    },
    parser: getPackageName(require.resolve('babel-eslint')),
  },
  plugins: [
    getPackageName(require.resolve('eslint-plugin-prefer-arrow')),
    getPackageName(require.resolve('eslint-plugin-simple-import-sort')),
    getPackageName(require.resolve('eslint-plugin-json-format')),
    getPackageName(require.resolve('eslint-plugin-sort-keys-fix')),
    getPackageName(require.resolve('eslint-plugin-react')),
  ],
  rules: {
    '@dword-design/import-alias/prefer-alias': [
      'error',
      { cwd: 'packagejson' },
    ],
    'arrow-body-style': ['error', 'as-needed'],
    'arrow-parens': ['error', 'as-needed'],
    'func-names': ['error', 'never'],
    'global-require': 'off',
    'import/no-commonjs': 'error',
    'import/no-dynamic-require': 'off',
    'import/prefer-default-export': 'off',
    /* 'json-files/restrict-ranges': [
      'error',
      { packages: tildePackages, versionHint: 'tilde' },
    ], */
    'linebreak-style': ['error', 'unix'],
    'new-cap': 'off',
    'no-console': 'off',
    'no-inline-comments': 'error',
    'no-negated-condition': 'error',
    'no-param-reassign': 'off',
    'no-regex-spaces': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: eslintRestrictedImports,
      },
    ],
    'no-restricted-syntax': [
      'error',
      'ObjectPattern',
      'ArrayPattern',
      "LogicalExpression[operator='??']",
    ],
    'no-return-assign': 'off',
    'no-template-curly-in-string': 'off',
    'no-underscore-dangle': 'off',
    'padding-line-between-statements': [
      'error',
      { blankLine: 'never', next: '*', prev: '*' },
      { blankLine: 'always', next: '*', prev: 'import' },
      { blankLine: 'any', next: 'import', prev: 'import' },
      { blankLine: 'always', next: 'export', prev: '*' },
    ],
    'prefer-arrow/prefer-arrow-functions': ['error'],
    'prefer-destructuring': 'off',
    'prettier/prettier': [
      'error',
      {
        arrowParens: 'avoid',
        semi: false,
        singleQuote: true,
      },
    ],
    'promise/prefer-await-to-callbacks': 'error',
    'promise/prefer-await-to-then': 'error',
    'react/jsx-sort-props': 'error',
    'require-await': 'error',
    'simple-import-sort/sort': 'error',
    'sort-keys-fix/sort-keys-fix': 'error',
    'vue/no-deprecated-functional-template': 'error',
    'vue/no-v-html': 'off',
    'vue/require-default-prop': 'off',
    'vue/require-prop-types': 'off',
  },
  settings: {
    'import/resolver': {
      [getPackageName(
        require.resolve('eslint-import-resolver-babel-module')
      )]: {},
    },
  },
}
