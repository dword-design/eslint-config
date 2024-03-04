import { compact, filter, join, map, omit } from '@dword-design/functions'
import confusingBrowserGlobals from 'confusing-browser-globals'
import packageName from 'depcheck-package-name'
import loadPkg from 'load-pkg'
import { without } from 'lodash-es'

import restrictedImports from './restricted-imports.js'

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
    extends: [
      packageName`eslint-config-airbnb-base`,
      `plugin:${packageName`eslint-plugin-promise`}/recommended`,
      `plugin:${packageName`eslint-plugin-import`}/recommended`,
      `plugin:${packageName`@dword-design/eslint-plugin-import-alias`}/recommended`,
      `plugin:${packageName`eslint-plugin-vue`}/vue3-recommended`,
      `plugin:${packageName`eslint-plugin-prettier`}/recommended`,
    ],
    globals: {
      self: true,
      window: true,
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
      parser: packageName`@babel/eslint-parser`,
    },
    plugins: [
      packageName`eslint-plugin-prefer-arrow`,
      packageName`eslint-plugin-simple-import-sort`,
      packageName`eslint-plugin-json-format`,
      packageName`eslint-plugin-sort-keys-fix`,
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
      // https://github.com/facebook/create-react-app/issues/12847
      'no-restricted-globals': [
        'error',
        {
          message:
            'Use Number.isFinite instead https://github.com/airbnb/javascript#standard-library--isfinite',
          name: 'isFinite',
        },
        {
          message:
            'Use Number.isNaN instead https://github.com/airbnb/javascript#standard-library--isnan',
          name: 'isNaN',
        },
        ...without(confusingBrowserGlobals, 'self').map(g => ({
          message: `Use window.${g} instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md`,
          name: g,
        })),
      ],

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
      [`${packageName`prettier`}/prettier`]: [
        'error',
        {
          arrowParens: 'avoid',
          semi: false,
          singleQuote: true,
          trailingComma: 'all',
        },
      ],
      'promise/prefer-await-to-then': 'error',
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
      'vue/attributes-order': ['error', { alphabetical: true }],
      'vue/no-deprecated-functional-template': 'error',
      'vue/order-in-components': 'off',
      'vue/prefer-true-attribute-shorthand': 'error',
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
