import getPackageName from 'get-package-name'
import safeRequire from 'safe-require'
import P from 'path'
import nodeEnv from 'better-node-env'
import { omitBy, mapValues, values } from '@dword-design/functions'
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
      require.resolve('eslint-plugin-vue')
    )}/recommended`,
    `plugin:${getPackageName(
      require.resolve('eslint-plugin-prettier')
    )}/recommended`,
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
  plugins: [
    getPackageName(require.resolve('eslint-plugin-prefer-arrow')),
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
    'vue/no-v-html': 'off',
    'no-param-reassign': 'off',
    'no-nested-ternary': 'off',
    'func-names': ['error', 'never'],
    'new-cap': 'off',
    'no-underscore-dangle': 'off',
    'require-await': 'error',
    'promise/prefer-await-to-then': 'error',
    'promise/prefer-await-to-callbacks': 'error',
    'vue/require-default-prop': 'off',
    'vue/require-prop-types': 'off',
    'vue/max-attributes-per-line': 'off', // conflicts with prettier
    'vue/html-self-closing': 'off', // conflicts with prettier
    'vue/html-indent': 'off', // conflicts with prettier
  },
  overrides: [
    {
      files: nodeEnv === 'test' ? ['**'] : ['**/*.spec.js'],
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
