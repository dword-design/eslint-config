import getPackageName from 'get-package-name'

export default {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: getPackageName(require.resolve('babel-eslint')),
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
    getPackageName(require.resolve('eslint-plugin-json-format')),
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
    'import/no-extraneous-dependencies': 'error',
    'import/no-commonjs': 'error',
    'no-regex-spaces': 'off',
    'no-restricted-imports': ['error', {
      paths: [
        { name: 'child_process', message: 'Please use child-process-promise instead.' },
        { name: 'fs', message: 'Please use fs-extra instead.' },
      ],
    }],
  },
  overrides: [
    {
      files: ['src/**'],
      rules: {
        'import/no-extraneous-dependencies': ['error', { devDependencies: false }],
      },
    },
    {
      files: ['test/**'],
      settings: {
        'import/resolver': require.resolve('./eslint-import-resolver-test'),
      },
    },
  ],
}
