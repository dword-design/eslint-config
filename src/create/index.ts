import pathLib from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfigSync } from '@dword-design/base';
import defu from '@dword-design/defu';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import confusingBrowserGlobals from 'confusing-browser-globals';
import packageName from 'depcheck-package-name';
import { defineConfig } from 'eslint/config';
import gitignore from 'eslint-config-flat-gitignore';
import { importX } from 'eslint-plugin-import-x';
import eslintPluginJsonc from 'eslint-plugin-jsonc';
import pluginPlaywright from 'eslint-plugin-playwright';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginPromise from 'eslint-plugin-promise';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import loadPkg from 'load-pkg';
import { compact, omit, without } from 'lodash-es';
import { sortOrder as packageJsonSortOrder } from 'sort-package-json';
import tseslint from 'typescript-eslint';

import restrictedImports from './restricted-imports';

export default () => {
  const packageConfig = loadPkg.sync() || {};
  const baseConfig = defu(loadConfigSync(), { testRunner: 'mocha' });

  const eslintRestrictedImports = restrictedImports
    .filter(
      importDef =>
        importDef.alternative === undefined ||
        importDef.alternative !== packageConfig.name,
    )
    .map(importDef => ({
      ...omit(importDef, ['alternative']),
      message: compact([
        importDef.message,
        importDef.alternative ? `Use '${importDef.alternative}' instead` : '',
      ]).join(' '),
    }));

  // mimic CommonJS variables -- not needed if using CommonJS
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = pathLib.dirname(__filename);
  const compat = new FlatCompat({ baseDirectory: __dirname });
  return defineConfig([
    gitignore({ strict: false }),
    js.configs.recommended,
    tseslint.configs.recommended,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    pluginPromise.configs['flat/recommended'],
    ...pluginVue.configs['flat/recommended'].map(plugin => ({
      files: ['**/*.ts', '**/*.vue'],
      ...plugin,
    })),
    ...compat.extends(
      `plugin:${packageName`@dword-design/eslint-plugin-import-alias`}/recommended`,
    ),
    { files: ['**/*.ts', '**/*.vue'], ...eslintPluginPrettierRecommended },
    ...(baseConfig.testRunner === 'playwright'
      ? [pluginPlaywright.configs['flat/recommended']]
      : []),
    ...compat.plugins(packageName`eslint-plugin-prefer-arrow`),
    ...compat.plugins(packageName`eslint-plugin-simple-import-sort`),
    ...compat.plugins(packageName`eslint-plugin-sort-keys-fix`),
    {
      files: ['**/*.ts', '**/*.vue'],
      ...eslintPluginUnicorn.configs.recommended,
    },
    ...eslintPluginJsonc.configs['flat/recommended-with-jsonc'],
    {
      files: ['**/*.vue'],
      languageOptions: {
        parserOptions: {
          babelOptions: { rootMode: 'upward-optional' },
          parser: packageName`@babel/eslint-parser`,
        },
      },
    },
    {
      files: ['**/*.json'],
      rules: { 'jsonc/indent': ['error', 2], 'jsonc/sort-keys': 'error' },
    },
    {
      files: ['**/package.json'],
      rules: {
        'jsonc/sort-keys': [
          'error',
          { order: packageJsonSortOrder, pathPattern: '^$' },
        ],
      },
    },
    {
      files: ['**/*.ts', '**/*.vue'],
      languageOptions: { globals: { ...globals.node, ...globals.browser } },
      rules: {
        ...(baseConfig.testRunner === 'playwright' && {
          'playwright/expect-expect': 'off',
        }),
        '@dword-design/import-alias/prefer-alias': [
          'error',
          { alias: { '@': '.' } },
        ],
        'arrow-body-style': ['error', 'as-needed'],
        'func-names': ['error', 'never'],
        'global-require': 'off',
        'import-x/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: [
              '**/*.spec.ts',
              ...(baseConfig.testRunner === 'playwright'
                ? [
                    'fixtures/**',
                    'global-setup.ts',
                    'global-teardown.ts',
                    'playwright.config.ts',
                  ]
                : ['global-test-hooks.ts']),
            ],
          },
        ],
        'import-x/no-named-as-default': 'off',
        'import-x/no-named-as-default-member': 'off',
        'linebreak-style': ['error', 'unix'],
        'new-cap': 'off',
        'no-await-in-loop': 'off',
        'no-console': 'off',
        'no-constant-condition': ['error', { checkLoops: false }],
        'no-continue': 'off',
        'no-empty-pattern': 'error',
        'no-lonely-if': 'off',
        'no-negated-condition': 'error',
        'no-nested-ternary': 'off',
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
        'no-restricted-imports': ['error', { paths: eslintRestrictedImports }],
        'no-return-assign': 'off',
        'no-template-curly-in-string': 'off',
        'no-underscore-dangle': 'off',
        'no-var': 'error',
        [`${packageName`prettier`}/prettier`]: [
          'error',
          {
            arrowParens: 'avoid',
            objectWrap: 'collapse',
            singleQuote: true,
            trailingComma: 'all',
          },
        ],
        'object-shorthand': ['error', 'always'],
        'padding-line-between-statements': [
          'error',
          { blankLine: 'never', next: '*', prev: '*' },
          { blankLine: 'always', next: '*', prev: 'import' },
          { blankLine: 'any', next: 'import', prev: 'import' },
          ...Object.keys({
            'block-like': true,
            const: true,
            expression: true,
            let: true,
          }).flatMap(name => [
            { blankLine: 'always', next: `multiline-${name}`, prev: '*' },
            { blankLine: 'always', next: '*', prev: `multiline-${name}` },
          ]),
          { blankLine: 'always', next: 'export', prev: '*' },
        ],

        'prefer-arrow/prefer-arrow-functions': ['error'],
        'prefer-destructuring': 'off',
        'require-await': 'error',
        'simple-import-sort/imports': 'error',
        'sort-keys-fix/sort-keys-fix': 'error',
        'unicorn/catch-error-name': 'off',
        'unicorn/consistent-function-scoping': 'off',
        'unicorn/no-anonymous-default-export': 'off',
        'unicorn/no-negated-condition': 'off',
        'unicorn/no-nested-ternary': 'off',
        'unicorn/no-null': 'off',
        'unicorn/prevent-abbreviations': 'off',
        'unicorn/template-indent': [
          'error',
          {
            tags: Object.keys({
              css: true,
              dedent: true,
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
        'vue/require-prop-types': 'off', // Complains about title not being a string if variable is passed
        ...(baseConfig.testRunner === 'playwright' && {
          'playwright/valid-title': ['error', { ignoreTypeOfTestName: true }],
        }),
      },
    },
    {
      files: ['**/*.spec.ts', '**/*.spec.ts'],
      ...(baseConfig.testRunner === 'mocha' && {
        languageOptions: { globals: { expect: 'readonly' } },
      }),
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
      files: [
        ...(baseConfig.testRunner === 'playwright' ? ['fixtures/**'] : []),
        '**/*.spec.ts',
      ],
      rules: {
        ...(baseConfig.testRunner === 'playwright' && {
          'no-empty-pattern': 'off',
        }),
      },
    },
    { files: ['**/*.vue'], rules: { 'vue/multi-word-component-names': 'off' } },
    {
      // TODO: Remove this after TypeScript migration
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'import/extensions': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/no-unresolved': 'off',
      },
    },
  ]);
};
