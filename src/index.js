import { mapValues, omitBy, values } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import loadPkg from 'load-pkg'

import restrictedImports from './restricted-imports'

const name = loadPkg.sync().name
const eslintRestrictedImports =
  restrictedImports
  |> omitBy(newName => newName === name)
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
    packageName`eslint-config-airbnb-base`,
    `plugin:${packageName`eslint-plugin-promise`}/recommended`,
    `plugin:${packageName`eslint-plugin-import`}/recommended`,
    `plugin:${packageName`@dword-design/eslint-plugin-import-alias`}/recommended`,
    `plugin:${packageName`eslint-plugin-vue`}/recommended`,
    `plugin:${packageName`eslint-plugin-prettier`}/recommended`,
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
  parser: packageName`vue-eslint-parser`,
  parserOptions: {
    babelOptions: {
      configFile: require.resolve('@dword-design/babel-config'),
    },
    parser: packageName`babel-eslint`,
  },
  plugins: [
    packageName`eslint-plugin-prefer-arrow`,
    packageName`eslint-plugin-simple-import-sort`,
    packageName`eslint-plugin-json-format`,
    packageName`eslint-plugin-sort-keys-fix`,
    packageName`eslint-plugin-react`,
  ],
  rules: {
    '@dword-design/import-alias/prefer-alias': [
      'error',
      { cwd: 'packagejson' },
    ],
    'arrow-body-style': ['error', 'as-needed'],
    'func-names': ['error', 'never'],
    'global-require': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        '': 'never',
        js: 'never',
        jsx: 'never',
        mjs: 'never',
      },
    ],
    'import/no-commonjs': 'error',
    'import/no-dynamic-require': 'off',
    'import/prefer-default-export': 'off',
    'linebreak-style': ['error', 'unix'],
    'new-cap': 'off',
    'no-console': 'off',
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
      {
        blankLine: 'always',
        next: '*',
        prev: '*',
      },
      {
        blankLine: 'never',
        next: ['expression'],
        prev: ['var', 'const', 'expression'],
      },
      {
        blankLine: 'any',
        next: 'import',
        prev: 'import',
      },
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
    'promise/prefer-await-to-then': 'error',
    'react/jsx-boolean-value': 'error',
    'react/jsx-sort-props': 'error',
    'require-await': 'error',
    'simple-import-sort/imports': 'error',
    'sort-keys-fix/sort-keys-fix': 'error',
    'vue/no-deprecated-functional-template': 'error',
    'vue/order-in-components': 'off',
    'vue/require-default-prop': 'off',
    'vue/require-prop-types': 'off',
  },
  settings: {
    'import/resolver': {
      [packageName`eslint-import-resolver-babel-module`]: {
        allowExistingDirectories: true,
      },
    },
  },
}
