import { compact, filter, join, map, omit } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import loadPkg from 'load-pkg'
import { createRequire } from 'module'

import restrictedImports from './restricted-imports.js'

const _require = createRequire(import.meta.url)

export default () => {
  const packageConfig = loadPkg.sync() || {}

  const eslintRestrictedImports =
    restrictedImports
    |> filter(
      importDef =>
        importDef.alternative === undefined ||
        importDef.alternative !== packageConfig.name,
    )
    |> map(importDef => ({
      ...(importDef |> omit(['alternative'])),
      message:
        [
          importDef.message,
          importDef.alternative ? `Use '${importDef.alternative}' instead` : '',
        ]
        |> compact
        |> join(' '),
    }))

  return {
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
      `plugin:${packageName`eslint-plugin-vue`}/vue3-recommended`,
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
                  message: "Use the global 'expect' variable instead",
                  name: 'expect',
                },
              ],
            },
          ],
        },
      },
      {
        files: '**/*.vue',
        rules: {
          'vue/multi-word-component-names': 'off',
        },
      },
    ],
    parser: packageName`vue-eslint-parser`,
    parserOptions: {
      babelOptions: {
        configFile: _require.resolve(packageName`@dword-design/babel-config`),
      },
      parser: packageName`@babel/eslint-parser`,
    },
    plugins: [
      packageName`eslint-plugin-prefer-arrow`,
      packageName`eslint-plugin-simple-import-sort`,
      packageName`eslint-plugin-json-format`,
      packageName`eslint-plugin-sort-keys-fix`,
      packageName`eslint-plugin-react`,
      packageName`eslint-plugin-github`,
      packageName`eslint-plugin-unicorn`,
    ],
    rules: {
      'arrow-body-style': ['error', 'as-needed'],
      'func-names': ['error', 'never'],
      'github/array-foreach': 'error',
      'global-require': 'off',
      'import/extensions': ['error', 'ignorePackages'],
      'import/no-commonjs': 'error',
      'import/no-dynamic-require': 'off',
      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: ['**/*.spec.js', 'global-test-hooks.js'] },
      ],
      'import/order': 'off',
      'import/prefer-default-export': 'off',
      'linebreak-style': ['error', 'unix'],
      'new-cap': 'off',
      'no-await-in-loop': 'off',
      'no-console': 'off',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-continue': 'off',
      'no-negated-condition': 'error',
      'no-param-reassign': 'off',
      'no-promise-executor-return': 'off',
      'no-regex-spaces': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: eslintRestrictedImports,
        },
      ],
      'no-restricted-syntax': ['error', "LogicalExpression[operator='??']"],
      'no-return-assign': 'off',
      'no-template-curly-in-string': 'off',
      'no-underscore-dangle': 'off',
      'object-shorthand': ['error', 'always'],
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'never',
          next: '*',
          prev: '*',
        },
        {
          blankLine: 'always',
          next: ['var', 'const'],
          prev: ['*'],
        },
        {
          blankLine: 'always',
          next: '*',
          prev: 'import',
        },
        {
          blankLine: 'any',
          next: 'import',
          prev: 'import',
        },
        {
          blankLine: 'always',
          next: 'export',
          prev: '*',
        },
        {
          blankLine: 'always',
          next: 'return',
          prev: '*',
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
          trailingComma: 'all',
        },
      ],
      'promise/prefer-await-to-then': 'error',
      'react/jsx-boolean-value': 'error',
      'react/jsx-sort-props': 'error',
      'require-await': 'error',
      'simple-import-sort/imports': 'error',
      'sort-keys-fix/sort-keys-fix': 'error',
      'unicorn/template-indent': [
        'error',
        {
          tags: Object.keys({
            css: true,
            endent: true,
            html: true,
            javascript: true,
            sql: true,
            svg: true,
            xml: true,
          }),
        },
      ],
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
        [packageName`eslint-import-resolver-exports`]: {},
      },
    },
  }
}
