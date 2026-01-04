import pathLib from 'node:path';
import { fileURLToPath } from 'node:url';

import importAlias from '@dword-design/eslint-plugin-import-alias';
import { FlatCompat } from '@eslint/eslintrc';
import stylistic from '@stylistic/eslint-plugin';
import confusingBrowserGlobals from 'confusing-browser-globals';
import packageName from 'depcheck-package-name';
import { defineConfig } from 'eslint/config';
import gitignore from 'eslint-config-flat-gitignore';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import eslintPluginJsonc from 'eslint-plugin-jsonc';
import pluginPlaywright from 'eslint-plugin-playwright';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import { compact, omit, without } from 'lodash-es';
import { readPackageSync } from 'read-pkg';
import { sortOrder as packageJsonSortOrder } from 'sort-package-json';
import tseslint from 'typescript-eslint';

import getTypeScriptProjectReferences from './get-typescript-project-references';
import restrictedImports from './restricted-imports';

export default ({ cwd = '.' } = {}) => {
  const packageConfig = readPackageSync({ cwd });
  const projectPaths = getTypeScriptProjectReferences({ cwd });

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
    tseslint.configs.recommended,
    // @ts-expect-error https://github.com/un-ts/eslint-plugin-import-x/issues/439
    importX.flatConfigs.recommended,
    // @ts-expect-error https://github.com/un-ts/eslint-plugin-import-x/issues/439
    importX.flatConfigs.typescript,
    ...pluginVue.configs['flat/recommended'].map(plugin => ({
      files: ['**/*.ts', '**/*.vue'],
      ...plugin,
    })),
    { files: ['**/*.ts', '**/*.vue'], ...stylistic.configs.recommended },
    { files: ['**/*.ts', '**/*.vue'], ...importAlias.configs.recommended },
    { files: ['**/*.ts', '**/*.vue'], ...eslintPluginPrettierRecommended },
    pluginPlaywright.configs['flat/recommended'],
    ...compat.plugins(packageName`eslint-plugin-prefer-arrow`),
    ...compat.plugins(packageName`eslint-plugin-simple-import-sort`),
    ...compat.plugins(packageName`eslint-plugin-sort-keys-fix`),
    {
      files: ['**/*.ts', '**/*.vue'],
      ...eslintPluginUnicorn.configs.recommended,
    },
    ...eslintPluginJsonc.configs['flat/recommended-with-jsonc'],
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
      files: ['**/*.ts'],
      rules: {
        'unicorn/no-empty-file': 'off', // TODO: Deactivate comments when it's possible https://github.com/sindresorhus/eslint-plugin-unicorn/pull/2300
      },
    },
    {
      files: ['**/*.ts', '**/*.vue'],
      languageOptions: {
        globals: { ...globals.node, ...globals.browser },
        parserOptions: { parser: tseslint.parser },
      },
      rules: {
        '@stylistic/linebreak-style': ['error', 'unix'],
        '@stylistic/padding-line-between-statements': [
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
          { blankLine: 'always', next: 'type', prev: '*' },
        ],
        'arrow-body-style': ['error', 'as-needed'],
        'func-names': ['error', 'never'],
        'global-require': 'off',
        'import-x/extensions': ['error', 'ignorePackages', { ts: 'never' }],
        'import-x/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: [
              '**/*.spec.ts',
              'fixtures/**',
              'global-setup.ts',
              'global-teardown.ts',
              'playwright.config.ts',
            ],
          },
        ],
        'import-x/no-named-as-default': 'off',
        'import-x/no-named-as-default-member': 'off',
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
              endent: true,
              html: true,
              javascript: true,
              sql: true,
              svg: true,
              xml: true,
            }),
          },
        ],
      },
      settings: {
        'import-x/resolver-next': [
          createTypeScriptImportResolver({
            extensionAlias: { '.js': ['.js'] },
            noWarnOnMultipleProjects: true,
            // Disable auto-guessing of .ts when .js is imported
            project: projectPaths, // TODO: Remove this when we don't need to pass projects anymore
          }),
        ],
      },
    },
    {
      files: ['**/*.spec.ts'],
      rules: {
        'playwright/expect-expect': 'off',
        'playwright/no-focused-test': 'off',
        'playwright/valid-title': ['error', { ignoreTypeOfTestName: true }],
        'unicorn/error-message': 'off',
      },
    },
    {
      files: ['fixtures/**', '**/*.spec.ts'],
      rules: { 'no-empty-pattern': 'off' },
    },
    {
      files: ['**/*.vue'],
      rules: {
        'vue/attributes-order': ['error', { alphabetical: true }],
        'vue/component-api-style': ['error', ['script-setup']],
        'vue/define-emits-declaration': 'error',
        'vue/multi-word-component-names': 'off',
        'vue/no-deprecated-functional-template': 'error',
        'vue/prefer-true-attribute-shorthand': 'error',
        'vue/prefer-use-template-ref': 'error',
        'vue/require-default-prop': 'off',
        'vue/slot-name-casing': 'error',
      },
    },
  ]);
};
