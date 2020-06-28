import { endent, flatten, map, mapValues, pick } from '@dword-design/functions'
import { ESLint } from 'eslint'
import outputFiles from 'output-files'
import P from 'path'
import stealthyRequire from 'stealthy-require'
import withLocalTmpDir from 'with-local-tmp-dir'

const runTest = config => () => {
  const filename = config.filename || 'index.js'
  const messages = config.messages || []
  return withLocalTmpDir(async () => {
    await outputFiles({
      '.babelrc.json': JSON.stringify({
        extends: '@dword-design/babel-config',
      }),
      'package.json': JSON.stringify({}),
      ...config.files,
    })
    const eslintConfig = stealthyRequire(require.cache, () => require('.'))
    const eslint = new ESLint({
      extensions: ['.js', '.json', '.vue'],
      useEslintrc: false,
      overrideConfig: eslintConfig,
    })
    const lintedMessages =
      eslint.lintText(config.code, { filePath: filename })
      |> await
      |> map('messages')
      |> flatten
      |> map(pick(['message', 'ruleId']))
    expect(lintedMessages).toEqual(messages)
  })
}

export default {
  'dev dependency in root': {
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          devDependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
    },
    code: endent`
      import 'foo'

    `,
    messages: [
      {
        message:
          "'foo' should be listed in the project's dependencies, not devDependencies.",
        ruleId: 'import/no-extraneous-dependencies',
      },
    ],
  },
  'dev dependency in source': {
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          devDependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
    },
    code: endent`
      import 'foo'

    `,
    filename: P.join('src', 'index.js'),
    messages: [
      {
        message:
          "'foo' should be listed in the project's dependencies, not devDependencies.",
        ruleId: 'import/no-extraneous-dependencies',
      },
    ],
  },
  'indent: valid': {
    code: endent`
      export default () => {
        console.log('foo')
      }

    `,
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
  'json: syntax error': {
    code: endent`
      {
        "foo":
      }
    `,
    filename: 'index.json',
    messages: [{ message: 'Unexpected token }', ruleId: null }],
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
  },
  'package.json: valid': {
    code: JSON.stringify(
      {
        name: 'foo',
        version: '1.0.0',
      },
      undefined,
      2
    ),
    filename: 'package.json',
  },
  'package.json: unsorted': {
    code: JSON.stringify(
      {
        version: '1.0.0',
        name: 'foo',
      },
      undefined,
      2
    ),
    filename: 'package.json',
    messages: [{ message: 'JSON is not sorted', ruleId: 'JSON sorting' }],
  },
  'arrow function': {
    code: endent`
      export default () => console.log('foo')

    `,
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
  'prod dependency in src': {
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
    },
    code: endent`
      import 'foo'

    `,
    filename: P.join('src', 'index.js'),
  },
  'regex-spaces': {
    code: endent`
      export default /  /

    `,
  },
  'restricted import: inside': {
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
    code: endent`
      import 'puppeteer'

    `,
  },
  'restricted import: outside': {
    files: {
      'node_modules/puppeteer/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            puppeteer: '^1.0.0',
          },
        },
        undefined,
        2
      ),
    },
    code: endent`
      import 'puppeteer'

    `,
    messages: [
      {
        message:
          "'puppeteer' import is restricted from being used. Please use '@dword-design/puppeteer' instead",
        ruleId: 'no-restricted-imports',
      },
    ],
  },
  valid: {
    code: endent`
      console.log()
    
    `,
  },
  semicolon: {
    code: endent`
      console.log();

    `,
    messages: [{ message: 'Delete `;`', ruleId: 'prettier/prettier' }],
  },
  'test: dev dependency': {
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
    code: endent`
      import 'foo'
      
    `,
    filename: 'index.spec.js',
  },
  'test: restricted import': {
    files: {
      'node_modules/puppeteer/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            puppeteer: '^1.0.0',
          },
        },
        undefined,
        2
      ),
    },
    code: endent`
      import 'puppeteer'

    `,
    filename: 'index.spec.js',
    messages: [
      {
        message:
          "'puppeteer' import is restricted from being used. Please use '@dword-design/puppeteer' instead",
        ruleId: 'no-restricted-imports',
      },
    ],
  },
  'test: imported expect': {
    files: {
      'package.json': endent`
        {
          "devDependencies": {
            "expect": "^1.0.0"
          }
        }

      `,
    },
    code: endent`
      import expect from 'expect'

      expect(1).toEqual(1)

    `,
    filename: 'index.spec.js',
    messages: [
      {
        message:
          "'expect' import is restricted from being used. Please use the global 'expect' variable instead",
        ruleId: 'no-restricted-imports',
      },
    ],
  },
  'test: global expect': {
    code: endent`
      expect(1).toEqual(1)
      
    `,
    filename: 'index.spec.js',
  },
  'test: prod dependency': {
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
    },
    code: endent`
      import 'foo'

    `,
    filename: 'src/index.spec.js',
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
  },
  'arrow function assignment': {
    code: endent`
      export default foo => (foo.bar = 'bar')

    `,
  },
  'pipeline operator': {
    code: endent`
      export default async () => 1 |> (x => x + 1) |> await
      
    `,
  },
  'deep nesting': {
    code: endent`
      export default () => console.log(() => (1 + 2 + 3 + 4) * 3 + 5 + 3 + 5 + 56 + 123 + 55456 + 23434 + 23434 + 2344)

    `,
    messages: [
      {
        message:
          'Replace `·console.log(()·=>·(1·+·2·+·3·+·4)·*·3·+·5·+·3·+·5·+·56·+·123·+·55456·+·23434·+·23434·+·2344` with `⏎··console.log(⏎····()·=>⏎······(1·+·2·+·3·+·4)·*·3·+·5·+·3·+·5·+·56·+·123·+·55456·+·23434·+·23434·+·2344⏎··`',
        ruleId: 'prettier/prettier',
      },
    ],
  },
  'single export': {
    code: endent`
      export const foo = 'bar'

    `,
  },
  'param reassign': {
    code: endent`
      export default foo => {
        foo = 'bar'
        console.log(foo)
      }

    `,
  },
  'multiple attributes per line': {
    code: endent`
      <template>
        <div class="foo" style="color: red" />
      </template>

    `,
    filename: 'index.vue',
  },
  'v-html': {
    code: endent`
      <template>
        <div v-html="foo" />
      </template>
      
      <script>
      export default {
        computed: {
          foo: () => 'foo',
        },
      }
      </script>

    `,
    filename: 'index.vue',
  },
  'self-closing void elements': {
    code: endent`
      <template>
        <img />
      </template>

    `,
    filename: 'index.vue',
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
  'unnamed function': {
    code: endent`
      console.log(function () {
        console.log(this)
      })

    `,
  },
  'new lower-case': {
    code: endent`
      const foo = () => {}

      export default new foo()

    `,
  },
  'underscore dangle': {
    code: endent`
      const foo = {}
      console.log(foo._bar)

    `,
  },
  'html indent': {
    code: endent`
      <template>
        <div
          :is-active="
            $route.name === 'task-view-detail' &&
            $route.params.taskViewId === entity._id
          "
        />
      </template>

    `,
    filename: 'index.vue',
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
  'promise then': {
    code: endent`
      export default () => Promise.resolve().then(x => x)

    `,
    messages: [
      {
        message: 'Prefer await to then().',
        ruleId: 'promise/prefer-await-to-then',
      },
    ],
  },
  'destructuring: object': {
    code: endent`
      const { foo } = { foo: 'bar' }
      console.log(foo)

    `,
    messages: [
      {
        message: "Using 'ObjectPattern' is not allowed.",
        ruleId: 'no-restricted-syntax',
      },
    ],
  },
  'destructuring: array': {
    code: endent`
      const [foo] = ['bar']
      console.log(foo)

    `,
    messages: [
      {
        message: "Using 'ArrayPattern' is not allowed.",
        ruleId: 'no-restricted-syntax',
      },
    ],
  },
  'destructuring: parameter': {
    code: endent`
      export default ({ foo }) => console.log(foo)

    `,
    messages: [
      {
        message: "Using 'ObjectPattern' is not allowed.",
        ruleId: 'no-restricted-syntax',
      },
    ],
  },
  'possible destructuring': {
    code: endent`
      const bar = { foo: 'test' }
      const foo = bar.foo
      console.log(foo)

    `,
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
  'import order': {
    files: {
      'node_modules/foo/index.js': '',
      'node_modules/bar/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            bar: '^1.0.0',
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
    },
    code: endent`
      import foo from 'foo'
      import bar from 'bar'

      console.log(foo)
      console.log(bar)

    `,
    messages: [
      {
        message: 'Run autofix to sort these imports!',
        ruleId: 'simple-import-sort/sort',
      },
    ],
  },
  'named import wrong order': {
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
    },
    code: endent`
      import { foo, bar } from 'foo'

      console.log(foo)
      console.log(bar)

    `,
    messages: [
      {
        message: 'Run autofix to sort these imports!',
        ruleId: 'simple-import-sort/sort',
      },
    ],
  },
  'named import right order': {
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
    },
    code: endent`
      import { bar, foo } from 'foo'

      console.log(bar)
      console.log(foo)

    `,
  },
  'blank lines: simple': {
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
  },
  'blank lines: import and statement without newline': {
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
    },
    code: endent`
      import foo from 'foo'
      console.log(foo)

    `,
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
  },
  'blank lines: import and statement with newline': {
    files: {
      'node_modules/foo/index.js': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
    },
    code: endent`
      import foo from 'foo'

      console.log(foo)

    `,
  },
  'blank lines: imports without newline': {
    files: {
      'bar.js': endent`
        export default 'bar'
      
      `,
      'foo.js': endent`
        export default 'foo'
        
      `,
    },
    code: endent`
      import bar from './bar'
      import foo from './foo'

      console.log(bar)
      console.log(foo)

    `,
  },
  'blank lines: imports with newline': {
    files: {
      'bar.js': endent`
        export default 'bar'
      
      `,
      'foo.js': endent`
        export default 'foo'
        
      `,
    },
    code: endent`
      import bar from './bar'

      import foo from './foo'

      console.log(foo)
      console.log(bar)

    `,
    messages: [
      {
        message: 'Run autofix to sort these imports!',
        ruleId: 'simple-import-sort/sort',
      },
    ],
  },
  'blank lines: import groups without newline': {
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
        },
        undefined,
        2
      ),
    },
    code: endent`
      import foo from 'foo'
      import bar from './bar'

      console.log(foo)
      console.log(bar)

    `,
    messages: [
      {
        message: 'Run autofix to sort these imports!',
        ruleId: 'simple-import-sort/sort',
      },
    ],
  },
  'blank lines: import groups with newline': {
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
        },
        undefined,
        2
      ),
    },
    code: endent`
      import foo from 'foo'

      import bar from './bar'
      
      console.log(foo)
      console.log(bar)

    `,
  },
  'blank lines: exports without newline': {
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
  },
  'blank lines: exports with newline': {
    code: endent`
      export const foo = 1

      export const bar = 2

    `,
  },
  'comments: without blank line': {
    code: endent`
      console.log('foo')
      // foo
      console.log('bar')

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
  },
  'inline comments': {
    code: endent`
      export default 1 // foo

    `,
    messages: [
      {
        message: 'Unexpected comment inline with code.',
        ruleId: 'no-inline-comments',
      },
    ],
  },
  'alias: parent': {
    files: {
      'foo.js': '',
    },
    code: endent`
      import '@/foo'

    `,
    filename: P.join('sub', 'index.js'),
  },
  'alias: child': {
    files: {
      'foo.js': '',
    },
    code: endent`
      import '@/foo'

    `,
    messages: [
      {
        message:
          "Unexpected subpath import via alias '@/foo'. Use './foo' instead",
        ruleId: '@dword-design/import-alias/prefer-alias',
      },
    ],
  },
  'alias: import in package': {
    files: {
      sub: {
        'foo.js': '',
        'package.json': JSON.stringify({}),
      },
    },
    code: endent`
      import '@/foo'

    `,
    filename: P.join('sub', 'sub', 'index.js'),
  },
  'alias: parent import in package': {
    files: {
      sub: {
        'foo.js': '',
        'package.json': JSON.stringify({}),
      },
    },
    code: endent`
      import '../foo'

    `,
    filename: P.join('sub', 'sub', 'index.js'),
    messages: [
      {
        message: "Unexpected parent import '../foo'. Use '@/foo' instead",
        ruleId: '@dword-design/import-alias/prefer-alias',
      },
    ],
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
  },
} |> mapValues(runTest)
