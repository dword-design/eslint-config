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
  'import: directory': {
    code: endent`
      import './sub'

    `,
    files: {
      sub: {},
    },
  },
  'import: extension with js': {
    code: endent`
      import './foo.js'

    `,
    files: {
      'foo.js': '',
    },
    messages: [
      {
        message: 'Unexpected use of file extension "js" for "./foo.js"',
        ruleId: 'import/extensions',
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
      const foo = 1
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
  valid: {
    code: endent`
      export default 1

    `,
  },
  'vue: attributes not sorted': {
    code: endent`
      <script>
      export default {
        render: () => <div class="foo" aria-hidden="true" />,
      }
      </script>

    `,
    filename: 'index.vue',
    messages: [
      {
        message: 'Props should be sorted alphabetically',
        ruleId: 'react/jsx-sort-props',
      },
    ],
  },
  'vue: boolean before value': {
    code: endent`
      <script>
      export default {
        render: () => <div is-hidden class="foo" />,
      }
      </script>

    `,
    filename: 'index.vue',
    messages: [
      {
        message: 'Props should be sorted alphabetically',
        ruleId: 'react/jsx-sort-props',
      },
    ],
  },
  'vue: boolean: constant true': {
    code: endent`
      <script>
      export default {
        render: () => <div is-foo={true} />,
      }
      </script>

    `,
    filename: 'index.vue',
    messages: [
      {
        message: 'Value must be omitted for boolean attributes',
        ruleId: 'react/jsx-boolean-value',
      },
    ],
  },
  'vue: boolean: prop': {
    code: endent`
      <script>
      export default {
        render: context => <div is-foo={context.props.foo} />,
      }
      </script>

    `,
    filename: 'index.vue',
  },
  'vue: boolean: valid': {
    code: endent`
      <script>
      export default {
        render: () => <div is-foo />,
      }
      </script>

    `,
    filename: 'index.vue',
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
  'vue: valid': {
    code: endent`
      <script>
      export default {
        render: () => <div aria-hidden="true" class="foo" />,
      }
      </script>

    `,
    filename: 'index.vue',
  },
} |> mapValues(runTest)
