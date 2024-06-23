import {
  endent,
  flatten,
  join,
  map,
  mapValues,
  pick,
} from '@dword-design/functions'
import deepmerge from 'deepmerge'
import packageName from 'depcheck-package-name'
import { ESLint } from 'eslint'
import inFolder from 'in-folder'
import nodeVersion from 'node-version'
import outputFiles from 'output-files'
import P from 'path'
import withLocalTmpDir from 'with-local-tmp-dir'

import self from './index.js'

const runTest = config => () => {
  config = {
    cwd: '.',
    eslintConfig: {},
    filename: 'index.js',
    messages: [],
    ...config,
  }
  config.output = config.output || config.code

  return withLocalTmpDir(async () => {
    await outputFiles({
      '.babelrc.json': JSON.stringify({
        extends: '@dword-design/babel-config',
      }),
      'package.json': JSON.stringify({ type: 'module' }),
      ...config.files,
    })

    return inFolder(config.cwd, async () => {
      const eslintConfig = {
        extensions: ['.json', '.vue'],
        overrideConfig: deepmerge(self(), config.eslintConfig),
        useEslintrc: false,
      }

      const eslintToLint = new ESLint(eslintConfig)

      const eslintToFix = new ESLint({ ...eslintConfig, fix: true })

      const lintedMessages =
        eslintToLint.lintText(config.code, { filePath: config.filename })
        |> await
        |> map('messages')
        |> flatten
        |> map(pick(['message', 'ruleId']))
      expect(lintedMessages).toEqual(config.messages)

      const lintedOutput =
        eslintToFix.lintText(config.code, { filePath: config.filename })
        |> await
        |> map('output')
        |> join('\n')
      expect(lintedOutput || config.code).toEqual(config.output)
    })
  })
}

export default {
  'alias: child': {
    code: endent`
      import '@/foo.js'

    `,
    files: {
      'foo.js': '',
    },
    messages: [
      {
        message:
          "Unexpected subpath import via alias '@/foo.js'. Use './foo.js' instead",
        ruleId: '@dword-design/import-alias/prefer-alias',
      },
    ],
    output: endent`
      import './foo.js'

    `,
  },
  'alias: parent': {
    code: endent`
      import '@/foo.js'

    `,
    filename: P.join('sub', 'index.js'),
    files: {
      'foo.js': '',
    },
  },
  'alias: parent import': {
    code: endent`
      import '../foo.js'

    `,
    filename: P.join('sub', 'sub', 'index.js'),
    files: {
      '.babelrc.json': JSON.stringify({
        extends: packageName`@dword-design/babel-config`,
      }),
      sub: {
        'foo.js': '',
      },
    },
    messages: [
      {
        message:
          "Unexpected parent import '../foo.js'. Use '@/sub/foo.js' instead",
        ruleId: '@dword-design/import-alias/prefer-alias',
      },
    ],
    output: endent`
      import '@/sub/foo.js'

    `,
  },
  'arrow function': {
    code: endent`
      export default () => console.log('foo')

    `,
  },
  'arrow function assignment': {
    code: endent`
      export default foo => (foo.bar = 'bar')

    `,
  },
  'arrow function block': {
    code: endent`
      export default foo => {
        console.log(foo)
      }

    `,
  },
  'arrow function returning block': {
    code: endent`
      export default foo => {
        return console.log(foo)
      }

    `,
    messages: [
      {
        message:
          'Unexpected block statement surrounding arrow body; move the returned value immediately after the `=>`.',
        ruleId: 'arrow-body-style',
      },
    ],
    output: endent`
      export default foo => console.log(foo)

    `,
  },
  'arrow function with unneeded parens': {
    code: endent`
      export default (foo) => foo

    `,
    messages: [
      { message: 'Replace `(foo)` with `foo`', ruleId: 'prettier/prettier' },
    ],
    output: endent`
      export default foo => foo

    `,
  },
  'arrow function without parens': {
    code: endent`
      export default foo => foo

    `,
  },
  'async without await': {
    code: endent`
      export default async () => console.log('foo')

    `,
    messages: [
      {
        message: "Async arrow function has no 'await' expression.",
        ruleId: 'require-await',
      },
    ],
  },
  'await inside loop': {
    code: endent`
      for (let i = 0; i < 10; i += 1) {
        await Promise.resolve()
      }

    `,
  },
  'blank line: between exports: no': {
    code: endent`
      export const foo = 1
      export const bar = 2

    `,
    messages: [
      {
        message: 'Expected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      export const foo = 1

      export const bar = 2

    `,
  },
  'blank line: between single-line statements: no': {
    code: endent`
      console.log('foo')
      console.log('bar')

    `,
  },
  'blank line: between single-line statements: yes': {
    code: endent`
      console.log('foo')

      console.log('bar')

    `,
    messages: [
      {
        message: 'Unexpected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      console.log('foo')
      console.log('bar')

    `,
  },
  'blank line: between statement and export: no': {
    code: endent`
      console.log('foo')
      export const foo = 1

    `,
    messages: [
      {
        message: 'Expected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      console.log('foo')

      export const foo = 1

    `,
  },
  'blank line: import and statement with newline': {
    code: endent`
      import foo from 'foo'

      console.log(foo)

    `,
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2,
      ),
    },
  },
  'blank line: import and statement without newline': {
    code: endent`
      import foo from 'foo'
      console.log(foo)

    `,
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2,
      ),
    },
    messages: [
      {
        message:
          'Expected 1 empty line after import statement not followed by another import.',
        ruleId: 'import/newline-after-import',
      },
      {
        message: 'Expected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      import foo from 'foo'

      console.log(foo)

    `,
  },
  'blank line: import groups with newline': {
    code: endent`
      import foo from 'foo'

      import bar from './bar.js'

      console.log(foo)
      console.log(bar)

    `,
    files: {
      'bar.js': endent`
        export default 1

      `,
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
          type: 'module',
        },
        undefined,
        2,
      ),
    },
  },
  'blank line: import groups without newline': {
    code: endent`
      import foo from 'foo'
      import bar from './bar.js'

      console.log(foo)
      console.log(bar)

    `,
    files: {
      'bar.js': endent`
        export default 1

      `,
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
          type: 'module',
        },
        undefined,
        2,
      ),
    },
    messages: [
      {
        message: 'Run autofix to sort these imports!',
        ruleId: 'simple-import-sort/imports',
      },
    ],
    output: endent`
      import foo from 'foo'

      import bar from './bar.js'

      console.log(foo)
      console.log(bar)

    `,
  },
  'blank line: imports with newline': {
    code: endent`
      import bar from './bar.js'

      import foo from './foo.js'

      console.log(foo)
      console.log(bar)

    `,
    files: {
      'bar.js': endent`
        export default 'bar'

      `,
      'foo.js': endent`
        export default 'foo'

      `,
    },
    messages: [
      {
        message: 'Run autofix to sort these imports!',
        ruleId: 'simple-import-sort/imports',
      },
    ],
    output: endent`
      import bar from './bar.js'
      import foo from './foo.js'

      console.log(foo)
      console.log(bar)

    `,
  },
  'blank line: imports without newline': {
    code: endent`
      import bar from './bar.js'
      import foo from './foo.js'

      console.log(bar)
      console.log(foo)

    `,
    files: {
      'bar.js': endent`
        export default 'bar'

      `,
      'foo.js': endent`
        export default 'foo'

      `,
    },
  },
  'blank line: multi-line block: after: no': {
    code: endent`
      const foo = 1

      if (foo) {
        console.log('foo')
      }
      console.log('foo')

    `,
    messages: [
      {
        message: 'Expected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      const foo = 1

      if (foo) {
        console.log('foo')
      }

      console.log('foo')

    `,
  },
  'blank line: multi-line block: after: yes': {
    code: endent`
      const foo = 1

      if (foo) {
        console.log('foo')
      }

      console.log('foo')

    `,
  },
  'blank line: multi-line block: before: no': {
    code: endent`
      const foo = true
      if (foo) {
        console.log('foo')
      }

    `,
    messages: [
      {
        message: 'Expected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      const foo = true

      if (foo) {
        console.log('foo')
      }

    `,
  },
  'blank line: multi-line block: before: yes': {
    code: endent`
      const foo = true

      if (foo) {
        console.log('foo')
      }

    `,
  },
  'blank line: multi-line const declaration: after: no': {
    code: endent`
      const foo = {
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      }
      console.log(foo)

    `,
    messages: [
      {
        message: 'Expected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      const foo = {
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      }

      console.log(foo)

    `,
  },
  'blank line: multi-line const declaration: after: yes': {
    code: endent`
      const foo = {
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      }

      console.log(foo)

    `,
  },
  'blank line: multi-line const declaration: before: no': {
    code: endent`
      console.log('foo')
      const foo = {
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      }

      console.log(foo)

    `,
    messages: [
      {
        message: 'Expected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      console.log('foo')

      const foo = {
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      }

      console.log(foo)

    `,
  },
  'blank line: multi-line const declaration: before: yes': {
    code: endent`
      console.log('foo')

      const foo = {
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      }

      console.log(foo)

    `,
  },
  'blank line: multi-line let declaration: after: no': {
    code: endent`
      let foo = {
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      }
      foo = 1
      console.log(foo)

    `,
    messages: [
      {
        message: 'Expected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      let foo = {
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      }

      foo = 1
      console.log(foo)

    `,
  },
  'blank line: multi-line let declaration: after: yes': {
    code: endent`
      let foo = {
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      }

      foo = 1
      console.log(foo)

    `,
  },
  'blank line: multi-line let declaration: before: no': {
    code: endent`
      console.log('foo')
      let foo = {
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      }

      foo = 1
      console.log(foo)

    `,
    messages: [
      {
        message: 'Expected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      console.log('foo')

      let foo = {
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      }

      foo = 1
      console.log(foo)

    `,
  },
  'blank line: multi-line let declaration: before: yes': {
    code: endent`
      console.log('foo')

      let foo = {
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      }

      foo = 1
      console.log(foo)

    `,
  },
  'blank line: multi-line statement: after: no': {
    code: endent`
      console.log({
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      })
      console.log('foo')

    `,
    messages: [
      {
        message: 'Expected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      console.log({
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      })

      console.log('foo')

    `,
  },
  'blank line: multi-line statement: after: yes': {
    code: endent`
      console.log({
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      })

      console.log('foo')

    `,
  },
  'blank line: multi-line statement: before: no': {
    code: endent`
      console.log('foo')
      console.log({
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      })

    `,
    messages: [
      {
        message: 'Expected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      console.log('foo')

      console.log({
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      })

    `,
  },
  'blank line: multi-line statement: before: yes': {
    code: endent`
      console.log('foo')

      console.log({
        foo: 'Aenean eu leo quam. Pellentesque ornare sem',
      })

    `,
  },
  'blank line: newline between exports': {
    code: endent`
      export const foo = 1

      export const bar = 2

    `,
  },
  'blank line: newline between statement and export': {
    code: endent`
      console.log('foo')

      export const foo = 1

    `,
  },
  callbacks: {
    code: endent`
      const foo = () => {}

      foo(async error => {
        await console.log(error)
      })

    `,
  },
  'comments: with blank line': {
    code: endent`
      console.log('foo')

      // foo
      console.log('bar')

    `,
    messages: [
      {
        message: 'Unexpected blank line before this statement.',
        ruleId: 'padding-line-between-statements',
      },
    ],
    output: endent`
      console.log('foo')
      // foo
      console.log('bar')

    `,
  },
  'comments: without blank line': {
    code: endent`
      console.log('foo')
      // foo
      console.log('bar')

    `,
  },
  continue: {
    code: endent`
      for (let i = 0; i < 10; i += 1) {
        if (i > 5) {
          continue
        }
  
        console.log(i)
      }

    `,
  },
  'deep nesting': {
    code: endent`
      export default () => console.log(() => (1 + 2 + 3 + 4) * 3 + 5 + 3 + 5 + 56 + 123 + 55456 + 23434 + 23434 + 2344)

    `,
    messages: [
      {
        message:
          'Replace `·console.log(()·=>·(1·+·2·+·3·+·4)·*·3·+·5·+·3·+·5·+·56·+·123·+·55456·+·23434·+·23434·+·2344` with `⏎··console.log(⏎····()·=>⏎······(1·+·2·+·3·+·4)·*·3·+·5·+·3·+·5·+·56·+·123·+·55456·+·23434·+·23434·+·2344,⏎··`',
        ruleId: 'prettier/prettier',
      },
    ],
    output: endent`
      export default () =>
        console.log(
          () =>
            (1 + 2 + 3 + 4) * 3 + 5 + 3 + 5 + 56 + 123 + 55456 + 23434 + 23434 + 2344,
        )

    `,
  },
  'destructuring: array Promise.all': {
    code: endent`
      const [foo, bar] = await Promise.all([])
      console.log(foo)
      console.log(bar)

    `,
  },
  'destructuring: array for loop Object.entries': {
    code: endent`
      for (const [foo, bar] of Object.entries({})) {
        console.log(foo)
        console.log(bar)
      }

    `,
  },
  'destructuring: parameter': {
    code: endent`
      export default ({ foo }) => console.log(foo)

    `,
  },
  'destructuring: return values': {
    code: endent`
      const func = () => ({ x: 1, y: 2 })
      const { x, y } = func()
      console.log(x)
      console.log(y)

    `,
  },
  'dev dependency in global-test-hooks.js': {
    code: endent`
      import 'foo'

    `,
    filename: 'global-test-hooks.js',
    files: {
      'node_modules/foo': {
        'index.js': '',
        'package.json': JSON.stringify({ name: 'foo' }),
      },
      'package.json': JSON.stringify({
        devDependencies: {
          foo: '^1.0.0',
        },
      }),
    },
  },
  'dev dependency in root': {
    code: endent`
      import 'foo'

    `,
    files: {
      'node_modules/foo': {
        'index.js': '',
        'package.json': JSON.stringify({ name: 'foo' }),
      },
      'package.json': JSON.stringify(
        {
          devDependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2,
      ),
    },
    messages: [
      {
        message:
          "'foo' should be listed in the project's dependencies, not devDependencies.",
        ruleId: 'import/no-extraneous-dependencies',
      },
    ],
  },
  'dev dependency in source': {
    code: endent`
      import 'foo'

    `,
    filename: P.join('src', 'index.js'),
    files: {
      'node_modules/foo': {
        'index.js': '',
        'package.json': JSON.stringify({ name: 'foo' }),
      },
      'package.json': JSON.stringify(
        {
          devDependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2,
      ),
    },
    messages: [
      {
        message:
          "'foo' should be listed in the project's dependencies, not devDependencies.",
        ruleId: 'import/no-extraneous-dependencies',
      },
    ],
  },
  'dev dependency in test': {
    code: endent`
      import 'foo'

    `,
    filename: 'index.spec.js',
    files: {
      'node_modules/foo/index.js': '',
      'package.json': endent`
        {
          "devDependencies": {
            "foo": "^1.0.0"
          }
        }
      `,
    },
  },
  'esm import without main field': {
    code: endent`
      import 'foo'

    `,
    files: {
      'foo.js': '',
      'node_modules/foo': {
        'dist/index.js': '',
        'package.json': JSON.stringify({
          exports: './dist/index.js',
          name: 'foo',
          type: 'module',
        }),
      },
      'package.json': JSON.stringify({
        dependencies: { foo: '^1.0.0' },
        type: 'module',
      }),
    },
  },
  'file with babel features in parent folder of package': {
    code: endent`
      console.log(1 |> x => x * 2)

    `,
    cwd: 'sub',
    files: {
      'babel.config.json': JSON.stringify({
        extends: '@dword-design/babel-config',
      }),
      'sub/package.json': JSON.stringify({}),
    },
  },
  forEach: {
    code: endent`
      const foo = []
      foo.forEach(() => {})

    `,
    messages: [
      {
        message: 'Prefer for...of instead of Array.forEach',
        ruleId: 'github/array-foreach',
      },
    ],
  },
  'function block': {
    code: endent`
      export default function () {
        console.log('foo')
      }

    `,
    messages: [
      {
        message: 'Prefer using arrow functions over plain functions',
        ruleId: 'prefer-arrow/prefer-arrow-functions',
      },
    ],
  },
  'function style expression with string literal': {
    code: endent`
      export default {
        'foo bar': function () {
          console.log(this)
        },
      }

    `,
    messages: [
      { message: 'Expected method shorthand.', ruleId: 'object-shorthand' },
    ],
    output: endent`
      export default {
        'foo bar'() {
          console.log(this)
        },
      }

    `,
  },
  'functional in template': {
    code: endent`
      <template functional>
        <div />
      </template>

    `,
    filename: 'index.vue',
    messages: [
      {
        message: 'The `functional` template are deprecated.',
        ruleId: 'vue/no-deprecated-functional-template',
      },
    ],
  },
  'import order': {
    code: endent`
      import foo from 'foo'
      import bar from 'bar'

      console.log(foo)
      console.log(bar)

    `,
    files: {
      'node_modules/bar/index.js': '',
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            bar: '^1.0.0',
            foo: '^1.0.0',
          },
        },
        undefined,
        2,
      ),
    },
    messages: [
      {
        message: 'Run autofix to sort these imports!',
        ruleId: 'simple-import-sort/imports',
      },
    ],
    output: endent`
      import bar from 'bar'
      import foo from 'foo'

      console.log(foo)
      console.log(bar)

    `,
  },
  'import order with webpack loader syntax and aliases': {
    code: endent`
      import buyMeACoffeeImageUrl from '!url-loader!@/buymeacoffee.svg'
      import imageUrl from '@/support-me.jpg'

      console.log(imageUrl)
      console.log(buyMeACoffeeImageUrl)

    `,
    eslintConfig: {
      rules: {
        'import/no-webpack-loader-syntax': 'off',
      },
    },
    filename: P.join('sub', 'index.js'),
    files: {
      'buymeacoffee.svg': '',
      'support-me.jpg': '',
    },
  },
  'indent: invalid': {
    code: endent`
      export default () => {
          console.log('foo')
      }

    `,
    messages: [
      {
        message: 'Delete `··`',
        ruleId: 'prettier/prettier',
      },
    ],
    output: endent`
      export default () => {
        console.log('foo')
      }

    `,
  },
  'indent: valid': {
    code: endent`
      export default () => {
        console.log('foo')
      }

    `,
  },
  'inline comments': {
    code: endent`
      export default 1 // foo

    `,
  },
  'json: indent too big': {
    code: endent`
      {
          "foo": "bar"
      }
    `,
    filename: 'index.json',
    messages: [
      { message: 'Format Error: unexpected "  "', ruleId: 'JSON format' },
    ],
    output: endent`
      {
        "foo": "bar"
      }
    `,
  },
  'json: no indent': {
    code: endent`
      {
      "foo": "bar"
      }
    `,
    filename: 'index.json',
    messages: [
      { message: 'Format Error: expected "  " ', ruleId: 'JSON format' },
    ],
    output: endent`
      {
        "foo": "bar"
      }
    `,
  },
  'json: syntax error': {
    code: endent`
      {
        "foo":
      }
    `,
    filename: 'index.json',
    messages: [
      {
        message:
          parseInt(nodeVersion.major, 10) >= 20
            ? endent`
              Unexpected token '}', "{
                "foo":
              }" is not valid JSON
            `
            : 'Unexpected token }',
        ruleId: null,
      },
    ],
  },
  'json: valid': {
    code: endent`
      {
        "foo": "bar",
        "bar": {
          "baz": [
            "test",
            "test2"
          ]
        }
      }
    `,
    filename: 'index.json',
  },
  'missing file extension': {
    code: endent`
      import './foo'

    `,
    files: {
      'foo.js': '',
    },
    messages: [
      {
        message: 'Missing file extension "js" for "./foo"',
        ruleId: 'import/extensions',
      },
    ],
  },
  'missing trailing comma': {
    code: endent`
      console.log([
        'fooadfa sdfasdfasdf asdfasdfasdfasdf',
        'adfsddfsdfsadfasdf asdfasdf asdfasdf'
      ])

    `,
    messages: [{ message: 'Insert `,`', ruleId: 'prettier/prettier' }],
    output: endent`
      console.log([
        'fooadfa sdfasdfasdf asdfasdfasdfasdf',
        'adfsddfsdfsadfasdf asdfasdf asdfasdf',
      ])

    `,
  },
  'multi-root component': {
    code: endent`
      <template>
        <div />
        <div />
      </template>

    `,
    filename: 'index.vue',
  },
  'named import right order': {
    code: endent`
      import { bar, foo } from 'foo'

      console.log(bar)
      console.log(foo)

    `,
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2,
      ),
    },
  },
  'named import wrong order': {
    code: endent`
      import { foo, bar } from 'foo'

      console.log(foo)
      console.log(bar)

    `,
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2,
      ),
    },
    messages: [
      {
        message: 'Run autofix to sort these imports!',
        ruleId: 'simple-import-sort/imports',
      },
    ],
    output: endent`
      import { bar, foo } from 'foo'

      console.log(foo)
      console.log(bar)

    `,
  },
  'negated condition': {
    code: endent`
      const foo = 1

      if (!foo) {
        console.log('foo')
      } else {
        console.log('bar')
      }

    `,
    messages: [
      {
        message: 'Unexpected negated condition.',
        ruleId: 'no-negated-condition',
      },
    ],
  },
  'nested ternary': {
    code: endent`
      export default foo => (foo === 1 ? 2 : foo === 2 ? 3 : 4)

    `,
    messages: [
      {
        message: 'Do not nest ternary expressions.',
        ruleId: 'no-nested-ternary',
      },
    ],
  },
  'new lower-case': {
    code: endent`
      const foo = () => {}

      export default new foo()

    `,
  },
  'no file extension in node_modules import': {
    code: endent`
      import 'foo/bar'

    `,
    files: {
      'node_modules/foo/bar.js': '',
      'package.json': JSON.stringify({
        dependencies: {
          foo: '^1.0.0',
        },
      }),
    },
  },
  'nullish coalescing': {
    code: endent`
      console.log(1 ?? 2)

    `,
    messages: [
      {
        message: "Using 'LogicalExpression[operator='??']' is not allowed.",
        ruleId: 'no-restricted-syntax',
      },
    ],
  },
  'package.json: unsorted': {
    code: endent`
      {
        "version": "1.0.0",
        "name": "foo"
      }

    `,
    filename: 'package.json',
    messages: [{ message: 'JSON is not sorted', ruleId: 'JSON sorting' }],
    output: endent`
      {
        "name": "foo",
        "version": "1.0.0"
      }

    `,
  },
  'package.json: valid': {
    code: JSON.stringify(
      {
        name: 'foo',
        version: '1.0.0',
      },
      undefined,
      2,
    ),
    filename: 'package.json',
  },
  'param reassign': {
    code: endent`
      export default foo => {
        foo = 'bar'
        console.log(foo)
      }

    `,
  },
  'pipeline operator': {
    code: endent`
      export default async () => 1 |> (x => x + 1) |> await

    `,
  },
  'possible destructuring': {
    code: endent`
      const bar = { foo: 'test' }
      const foo = bar.foo
      console.log(foo)

    `,
  },
  'prod dependency in src': {
    code: endent`
      import 'foo'

    `,
    filename: P.join('src', 'index.js'),
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify({
        dependencies: {
          foo: '^1.0.0',
        },
      }),
    },
  },
  'promise then': {
    code: endent`
      export default () => Promise.resolve().then(x => x)

    `,
    messages: [
      {
        message: 'Prefer await to then()/catch()/finally().',
        ruleId: 'promise/prefer-await-to-then',
      },
    ],
  },
  'quotes: nested': {
    code: endent`
      export default "foo 'bar'"

    `,
  },
  'quotes: unnecessary escapes': {
    code: endent`
      export default 'foo \\'bar\\''

    `,
    messages: [
      {
        message: "Replace `'foo·\\'bar\\''` with `\"foo·'bar'\"`",
        ruleId: 'prettier/prettier',
      },
    ],
    output: endent`
      export default "foo 'bar'"

    `,
  },
  'regex-spaces': {
    code: endent`
      export default /  /

    `,
  },
  'restricted import: inside': {
    code: endent`
      import 'puppeteer'

    `,
    files: {
      'node_modules/puppeteer/index.js': '',
      'package.json': endent`
        {
          "name": "@dword-design/puppeteer",
          "dependencies": {
            "puppeteer": "^1.0.0"
          }
        }
      `,
    },
  },
  'restricted import: name': {
    code: endent`
      import { zipObject } from '@dword-design/functions'

      console.log(zipObject)

    `,
    files: {
      'node_modules/@dword-design/functions/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            '@dword-design/functions': '^1.0.0',
          },
        },
        undefined,
        2,
      ),
    },
    messages: [
      {
        message:
          "'zipObject' import from '@dword-design/functions' is restricted. Use map and fromPairs instead",
        ruleId: 'no-restricted-imports',
      },
    ],
  },
  'restricted import: outside': {
    code: endent`
      import 'puppeteer'

    `,
    files: {
      'node_modules/puppeteer/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            puppeteer: '^1.0.0',
          },
        },
        undefined,
        2,
      ),
    },
    messages: [
      {
        message:
          "'puppeteer' import is restricted from being used. Does not set no-sandbox. Use '@dword-design/puppeteer' instead",
        ruleId: 'no-restricted-imports',
      },
    ],
  },
  'semicolon: no': {
    code: endent`
      console.log()

    `,
  },
  'semicolon: yes': {
    code: endent`
      console.log();

    `,
    messages: [{ message: 'Delete `;`', ruleId: 'prettier/prettier' }],
    output: endent`
      console.log()

    `,
  },
  'service worker self': {
    code: 'console.log(self.chrome.action)\n',
  },
  'single export': {
    code: endent`
      export const foo = 'bar'

    `,
  },
  'template literal': {
    code: endent`
      let endent

      export default () =>
        endent\`
        adsfasdf
      \`

    `,
    messages: [
      {
        message: 'Templates should be properly indented.',
        ruleId: 'unicorn/template-indent',
      },
    ],
    output: endent`
      let endent

      export default () =>
        endent\`
          adsfasdf
        \`

    `,
  },
  'test: global expect': {
    code: endent`
      expect(1).toEqual(1)

    `,
    filename: 'index.spec.js',
  },
  'test: imported expect': {
    code: endent`
      import expect from 'expect'

      expect(1).toEqual(1)

    `,
    filename: 'index.spec.js',
    files: {
      'package.json': endent`
        {
          "devDependencies": {
            "expect": "^1.0.0"
          }
        }

      `,
    },
    messages: [
      {
        message:
          "'expect' import is restricted from being used. Use the global 'expect' variable instead",
        ruleId: 'no-restricted-imports',
      },
    ],
  },
  'test: prod dependency': {
    code: endent`
      import 'foo'

    `,
    filename: 'src/index.spec.js',
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2,
      ),
    },
  },
  'test: restricted import': {
    code: endent`
      import 'puppeteer'

    `,
    filename: 'index.spec.js',
    files: {
      'node_modules/puppeteer/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            puppeteer: '^1.0.0',
          },
        },
        undefined,
        2,
      ),
    },
    messages: [
      {
        message:
          "'puppeteer' import is restricted from being used. Does not set no-sandbox. Use '@dword-design/puppeteer' instead",
        ruleId: 'no-restricted-imports',
      },
    ],
  },
  'underscore dangle': {
    code: endent`
      const foo = {}
      console.log(foo._bar)

    `,
  },
  'unnamed function': {
    code: endent`
      console.log(function () {
        console.log(this)
      })

    `,
  },
  'unnecessary double negation': {
    code: endent`
      const foo = true

      if (!!foo) {
        console.log('foo')
      }

    `,
    messages: [
      {
        message: 'Redundant double negation.',
        ruleId: 'no-extra-boolean-cast',
      },
    ],
    output: endent`
      const foo = true

      if (foo) {
        console.log('foo')
      }

    `,
  },
  'unsorted object keys': {
    code: endent`
      export default { b: 1, a: 2 }

    `,
    messages: [
      {
        message:
          "Expected object keys to be in ascending order. 'a' should be before 'b'.",
        ruleId: 'sort-keys-fix/sort-keys-fix',
      },
    ],
    output: endent`
      export default { a: 2, b: 1 }

    `,
  },
  'v-html on component': {
    code: endent`
      <template>
        <foo v-html="html" />
      </template>

      <script>
      export default {
        computed: {
          html: () => '<div>foo</div>',
        },
      }
      </script>

    `,
    filename: 'index.vue',
    messages: [
      {
        message: "'v-html' directive can lead to XSS attack.",
        ruleId: 'vue/no-v-html',
      },
      {
        message: "Using v-html on component may break component's content.",
        ruleId: 'vue/no-v-text-v-html-on-component',
      },
    ],
  },
  'v-html on native element': {
    code: endent`
      <template>
        <span v-html="html" />
      </template>

      <script>
      export default {
        computed: {
          html: () => '<div>foo</div>',
        },
      }
      </script>

    `,
    filename: 'index.vue',
    messages: [
      {
        message: "'v-html' directive can lead to XSS attack.",
        ruleId: 'vue/no-v-html',
      },
    ],
  },
  valid: {
    code: endent`
      export default 1

    `,
  },
  var: {
    code: endent`
      var foo = 1
      foo = 2
      console.log(foo)

    `,
    messages: [
      {
        message: 'Unexpected var, use let or const instead.',
        ruleId: 'no-var',
      },
    ],
    output: endent`
      let foo = 1
      foo = 2
      console.log(foo)

    `,
  },
  'vue: attributes not sorted': {
    code: endent`
      <template>
        <div class="foo" aria-hidden="true" />
      </template>

    `,
    filename: 'index.vue',
    messages: [
      {
        message: 'Attribute "aria-hidden" should go before "class".',
        ruleId: 'vue/attributes-order',
      },
    ],
    output: endent`
      <template>
        <div aria-hidden="true" class="foo" />
      </template>

    `,
  },
  'vue: component order: invalid': {
    code: endent`
      <script>
      export default {
        props: {
          foo: {},
        },
        data: () => ({ bar: 1 }),
      }
      </script>

    `,
    filename: 'index.vue',
    messages: [
      {
        message:
          "Expected object keys to be in ascending order. 'data' should be before 'props'.",
        ruleId: 'sort-keys-fix/sort-keys-fix',
      },
    ],
    output: endent`
      <script>
      export default {
        data: () => ({ bar: 1 }),
        props: {
          foo: {},
        },
      }
      </script>

    `,
  },
  'vue: component order: valid': {
    code: endent`
      <script>
      export default {
        data: () => ({ bar: 1 }),
        props: {
          foo: {},
        },
      }
      </script>

    `,
    filename: 'index.vue',
  },
  'vue: index component name': {
    code: endent`
      <template>
        <div />
      </template>

    `,
    filename: P.join('src', 'index.vue'),
  },
  'vue: multi-word component name': {
    code: endent`
      <template>
        <div />
      </template>

    `,
    filename: 'index.vue',
  },
  'vue: page single-word name': {
    code: endent`
      <template>
        <div />
      </template>

    `,
    filename: P.join('pages', 'about.vue'),
  },
  'vue: single-word component name in library': {
    code: endent`
      <template>
        <div />
      </template>

    `,
    filename: P.join('src', 'button.vue'),
  },
  'vue: single-word component registered': {
    code: endent`
      import Vue from 'vue'

      Vue.component('Foo', {})

    `,
    files: {
      'node_modules/vue/index.js': '',
      'package.json': JSON.stringify({ dependencies: { vue: '*' } }),
    },
    messages: [
      {
        message: 'Component name "Foo" should always be multi-word.',
        ruleId: 'vue/multi-word-component-names',
      },
    ],
  },
  'vue: valid': {
    code: endent`
      <template>
        <div aria-hidden="true" class="foo" />
      </template>

    `,
    filename: 'index.vue',
  },
  'while true': {
    code: endent`
      while (true) {
        console.log('foo')
      }

    `,
  },
  window: {
    code: 'console.log(window)\n',
  },
} |> mapValues(runTest)
