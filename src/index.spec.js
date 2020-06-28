import { endent, flatten, map, mapValues, pick } from '@dword-design/functions'
import { ESLint } from 'eslint'
import getPackageName from 'get-package-name'
import outputFiles from 'output-files'
import P from 'path'
import sortObjectKeys from 'sort-object-keys'
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
      overrideConfig: eslintConfig,
      useEslintrc: false,
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
  'alias: child': {
    code: endent`
      import '@/foo'

    `,
    files: {
      'foo.js': '',
    },
    messages: [
      {
        message:
          "Unexpected subpath import via alias '@/foo'. Use './foo' instead",
        ruleId: '@dword-design/import-alias/prefer-alias',
      },
    ],
  },
  'alias: import in package': {
    code: endent`
      import '@/foo'

    `,
    filename: P.join('sub', 'sub', 'index.js'),
    files: {
      sub: {
        '.babelrc.json': JSON.stringify({
          extends: getPackageName(
            require.resolve('@dword-design/babel-config')
          ),
        }),
        'foo.js': '',
        'package.json': JSON.stringify({}),
      },
    },
  },
  'alias: parent': {
    code: endent`
      import '@/foo'

    `,
    filename: P.join('sub', 'index.js'),
    files: {
      'foo.js': '',
    },
  },
  'alias: parent import in package': {
    code: endent`
      import '../foo'

    `,
    filename: P.join('sub', 'sub', 'index.js'),
    files: {
      sub: {
        '.babelrc.json': JSON.stringify({
          extends: getPackageName(
            require.resolve('@dword-design/babel-config')
          ),
        }),
        'foo.js': '',
        'package.json': JSON.stringify({}),
      },
    },
    messages: [
      {
        message: "Unexpected parent import '../foo'. Use '@/foo' instead",
        ruleId: '@dword-design/import-alias/prefer-alias',
      },
    ],
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
  'blank lines: exports with newline': {
    code: endent`
      export const foo = 1

      export const bar = 2

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
  'blank lines: import and statement with newline': {
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
        2
      ),
    },
  },
  'blank lines: import and statement without newline': {
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
        2
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
  },
  'blank lines: import groups with newline': {
    code: endent`
      import foo from 'foo'

      import bar from './bar'
      
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
        },
        undefined,
        2
      ),
    },
  },
  'blank lines: import groups without newline': {
    code: endent`
      import foo from 'foo'
      import bar from './bar'

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
        },
        undefined,
        2
      ),
    },
    messages: [
      {
        message: 'Run autofix to sort these imports!',
        ruleId: 'simple-import-sort/sort',
      },
    ],
  },
  'blank lines: imports with newline': {
    code: endent`
      import bar from './bar'

      import foo from './foo'

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
        ruleId: 'simple-import-sort/sort',
      },
    ],
  },
  'blank lines: imports without newline': {
    code: endent`
      import bar from './bar'
      import foo from './foo'

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
  'comments: without blank line': {
    code: endent`
      console.log('foo')
      // foo
      console.log('bar')

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
  'dev dependency in root': {
    code: endent`
      import 'foo'

    `,
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
    messages: [
      {
        message:
          "'foo' should be listed in the project's dependencies, not devDependencies.",
        ruleId: 'import/no-extraneous-dependencies',
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
        2
      ),
    },
    messages: [
      {
        message: 'Run autofix to sort these imports!',
        ruleId: 'simple-import-sort/sort',
      },
    ],
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
    messages: [
      {
        message: 'Unexpected comment inline with code.',
        ruleId: 'no-inline-comments',
      },
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
  'json: syntax error': {
    code: endent`
      {
        "foo":
      }
    `,
    filename: 'index.json',
    messages: [{ message: 'Unexpected token }', ruleId: null }],
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
  'jsx: attributes not sorted': {
    code: endent`
      export default {
        render: () => <div class="foo" aria-hidden="true" />,
      }

    `,
    messages: [
      {
        message: 'Props should be sorted alphabetically',
        ruleId: 'react/jsx-sort-props',
      },
    ],
  },
  'jsx: boolean before value': {
    code: endent`
      export default {
        render: () => <div is-hidden class="foo" />,
      }

    `,
    messages: [
      {
        message: 'Props should be sorted alphabetically',
        ruleId: 'react/jsx-sort-props',
      },
    ],
  },
  'jsx: events before attributes': {
    code: endent`
      export default {
        render: () => <div v-on:click={() => {}} class="foo" />,
      }

    `,
    messages: [
      {
        message: 'Props should be sorted alphabetically',
        ruleId: 'react/jsx-sort-props',
      },
    ],
  },
  'jsx: valid': {
    code: endent`
      export default {
        render: () => <div aria-hidden="true" class="foo" />,
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
        2
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
        2
      ),
    },
    messages: [
      {
        message: 'Run autofix to sort these imports!',
        ruleId: 'simple-import-sort/sort',
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
    code: JSON.stringify(
      sortObjectKeys(
        {
          name: 'foo',
          version: '1.0.0',
        },
        ['version', 'name']
      ),
      undefined,
      2
    ),
    filename: 'package.json',
    messages: [{ message: 'JSON is not sorted', ruleId: 'JSON sorting' }],
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
        2
      ),
    },
    messages: [
      {
        message:
          "'puppeteer' import is restricted from being used. Please use '@dword-design/puppeteer' instead",
        ruleId: 'no-restricted-imports',
      },
    ],
  },
  'self-closing void elements': {
    code: endent`
      <template>
        <img />
      </template>

    `,
    filename: 'index.vue',
  },
  semicolon: {
    code: endent`
      console.log();

    `,
    messages: [{ message: 'Delete `;`', ruleId: 'prettier/prettier' }],
  },
  'single export': {
    code: endent`
      export const foo = 'bar'

    `,
  },
  'test: dev dependency': {
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
          "'expect' import is restricted from being used. Please use the global 'expect' variable instead",
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
        2
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
        2
      ),
    },
    messages: [
      {
        message:
          "'puppeteer' import is restricted from being used. Please use '@dword-design/puppeteer' instead",
        ruleId: 'no-restricted-imports',
      },
    ],
  },
  /*'tilde ranges: invalid': {
    code: JSON.stringify(
      {
        dependencies: {
          nuxt: '^1.0.0',
        },
      },
      undefined,
      2
    ),
    filename: 'package.json',
    messages: [
      {
        message: 'Invalid SemVer hint (tilde).',
        ruleId: 'json-files/restrict-ranges',
      },
    ],
  },*/
  'tilde ranges: valid': {
    code: JSON.stringify(
      {
        dependencies: {
          nuxt: '~1.0.0',
        },
      },
      undefined,
      2
    ),
    filename: 'package.json',
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
  valid: {
    code: endent`
      export default 1
    
    `,
  },
} |> mapValues(runTest)
