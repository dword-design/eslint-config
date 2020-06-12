import { endent, mapValues, map, filter } from '@dword-design/functions'
import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { ESLint } from 'eslint'
import P from 'path'
import stealthyRequire from 'stealthy-require'

const runTest = ({ files, result: expectedResult = [] }) => () =>
  withLocalTmpDir(async () => {
    await outputFiles(files)
    const config = stealthyRequire(require.cache, () => require('.'))
    const eslint = new ESLint({
      extensions: ['.js', '.json', '.vue'],
      overrideConfig: config,
    })
    const result =
      eslint.lintFiles('**')
      |> await
      |> filter(
        fileResult => fileResult.errorCount + fileResult.warningCount > 0
      )
      |> map(fileResult => ({
        filePath: P.relative(process.cwd(), fileResult.filePath),
        messages: fileResult.messages |> map('message'),
      }))
    expect(result).toEqual(expectedResult)
  })

export default {
  'dev dependency in root': {
    files: {
      'node_modules/foo/index.js': 'export default 1',
      'package.json': JSON.stringify(
        {
          devDependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
      'index.js': endent`
        import foo from 'foo'

        console.log(foo)

      `,
    },
    result: [
      {
        filePath: 'index.js',
        messages: [
          "'foo' should be listed in the project's dependencies, not devDependencies.",
        ],
      },
    ],
  },
  'dev dependency in source': {
    files: {
      'node_modules/foo/index.js': 'export default 1',
      'package.json': endent`
        {
          "devDependencies": {
            "foo": "^1.0.0"
          }
        }
      `,
      'src/index.js': endent`
        import foo from 'foo'

        console.log(foo)

      `,
    },
    result: [
      {
        filePath: P.join('src', 'index.js'),
        messages: [
          "'foo' should be listed in the project's dependencies, not devDependencies.",
        ],
      },
    ],
  },
  'indent: valid': {
    files: {
      'test.js': endent`
        export default () => {
          console.log('foo')
        }

      `,
    },
  },
  'indent: invalid': {
    files: {
      'test.js': endent`
        export default () => {
            console.log('foo')
        }

      `,
    },
    result: [
      {
        filePath: 'test.js',
        messages: ['Delete `··`'],
      },
    ],
  },
  'json: valid': {
    files: {
      'test.json': endent`
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
    },
  },
  'json: syntax error': {
    files: {
      'test.json': endent`
        {
          "foo":
        }
      `,
    },
    result: [
      {
        filePath: 'test.json',
        messages: ['Unexpected token }'],
      },
    ],
  },
  'json: no indent': {
    files: {
      'test.json': endent`
        {
        "foo": "bar"
        }
      `,
    },
    result: [
      {
        filePath: 'test.json',
        messages: ['Format Error: expected "  " '],
      },
    ],
  },
  'json: indent too big': {
    files: {
      'test.json': endent`
      {
          "foo": "bar"
      }
    `,
    },
    result: [
      {
        filePath: 'test.json',
        messages: ['Format Error: unexpected "  "'],
      },
    ],
  },
  'package.json: valid': {
    files: {
      'package.json': endent`
        {
          "name": "foo",
          "version": "1.0.0"
        }
      `,
    },
  },
  'package.json: unsorted': {
    files: {
      'package.json': endent`
      {
        "version": "1.0.0",
        "name": "foo"
      }
    `,
    },
    result: [
      {
        filePath: 'package.json',
        messages: ['JSON is not sorted'],
      },
    ],
  },
  'arrow function': {
    files: {
      'test.js': endent`
        export default () => console.log('foo')

      `,
    },
  },
  'function block': {
    files: {
      'test.js': endent`
        export default function () {
          console.log('foo')
        }

      `,
    },
    result: [
      {
        filePath: 'test.js',
        messages: ['Prefer using arrow functions over plain functions'],
      },
    ],
  },
  'prod dependency in src': {
    files: {
      'node_modules/foo/index.js': endent`
        export default 1
        
      `,
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
      'src/index.js': endent`
        import foo from 'foo'

        console.log(foo)

      `,
    },
  },
  'regex-spaces': {
    files: {
      'test.js': endent`
        export default /  /

      `,
    },
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
      'test.js': endent`
        import 'puppeteer'

      `,
    },
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
      'test.js': endent`
        import 'puppeteer'

      `,
    },
    result: [
      {
        filePath: 'test.js',
        messages: [
          "'puppeteer' import is restricted from being used. Please use '@dword-design/puppeteer' instead.",
        ],
      },
    ],
  },
  valid: {
    files: {
      'test.js': endent`
        console.log()
      
      `,
    },
  },
  semicolon: {
    files: {
      'test.js': endent`
        console.log();

      `,
    },
    result: [
      {
        filePath: 'test.js',
        messages: ['Delete `;`'],
      },
    ],
  },
  'test: dev dependency': {
    files: {
      'node_modules/foo/index.js': endent`
        export default 1

      `,
      'package.json': endent`
        {
          "devDependencies": {
            "foo": "^1.0.0"
          }
        }
      `,
      'src/index.spec.js': endent`
        import foo from 'foo'

        console.log(foo)
        
      `,
    },
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
      'src/index.spec.js': endent`
        import 'puppeteer'

      `,
    },
    result: [
      {
        filePath: P.join('src', 'index.spec.js'),
        messages: [
          "'puppeteer' import is restricted from being used. Please use '@dword-design/puppeteer' instead.",
        ],
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
      'src/index.spec.js': endent`
        import expect from 'expect'

        expect(1).toEqual(1)

      `,
    },
    result: [
      {
        filePath: P.join('src', 'index.spec.js'),
        messages: [
          "'expect' import is restricted from being used. Please use the global 'expect' variable instead.",
        ],
      },
    ],
  },
  'test: global expect': {
    files: {
      'src/index.spec.js': endent`
        expect(1).toEqual(1)
        
      `,
    },
  },
  'test: prod dependency': {
    files: {
      'node_modules/foo/index.js': endent`
        export default 1
        
      `,
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
      'src/index.spec.js': endent`
        import foo from 'foo'

        console.log(foo)

      `,
    },
  },
  'quotes: nested': {
    files: {
      'test.js': endent`
        export default "foo 'bar'"

      `,
    },
  },
  'quotes: unnecessary escapes': {
    files: {
      'test.js': endent`
        export default 'foo \\'bar\\''

      `,
    },
    result: [
      {
        filePath: 'test.js',
        messages: ["Replace `'foo·\\'bar\\''` with `\"foo·'bar'\"`"],
      },
    ],
  },
  'arrow function block': {
    files: {
      'test.js': endent`
        export default foo => {
          console.log(foo)
        }

      `,
    },
  },
  'pipeline operator': {
    files: {
      'test.js': endent`
        export default async () => 1 |> (x => x + 1) |> await
        
      `,
    },
  },
  'deep nesting': {
    files: {
      'test.js': endent`
        export default () => console.log(() => (1 + 2 + 3 + 4) * 3 + 5 + 3 + 5 + 56 + 123 + 55456 + 23434 + 23434 + 2344)

      `,
    },
    result: [
      {
        filePath: 'test.js',
        messages: [
          'Replace `·console.log(()·=>·(1·+·2·+·3·+·4)·*·3·+·5·+·3·+·5·+·56·+·123·+·55456·+·23434·+·23434·+·2344` with `⏎··console.log(⏎····()·=>⏎······(1·+·2·+·3·+·4)·*·3·+·5·+·3·+·5·+·56·+·123·+·55456·+·23434·+·23434·+·2344⏎··`',
        ],
      },
    ],
  },
  'single export': {
    files: {
      'test.js': endent`
        export const foo = 'bar'

      `,
    },
  },
  'param reassign': {
    files: {
      'test.js': endent`
        export default foo => {
          foo = 'bar'
          console.log(foo)
        }

      `,
    },
  },
  'multiple attributes per line': {
    files: {
      'test.vue': endent`
        <template>
          <div class="foo" style="color: red" />
        </template>

      `,
    },
  },
  'v-html': {
    files: {
      'test.vue': endent`
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
    },
  },
  'self-closing void elements': {
    files: {
      'test.vue': endent`
        <template>
          <img />
        </template>

      `,
    },
  },
  'nested ternary': {
    files: {
      'test.js': endent`
        export default foo => (foo === 1 ? 2 : foo === 2 ? 3 : 4)

      `,
    },
  },
  'unnamed function': {
    files: {
      'test.js': endent`
        console.log(function () {
          console.log(this)
        })

      `,
    },
  },
  'new lower-case': {
    files: {
      'test.js': endent`
        const foo = () => {}

        export default new foo()

      `,
    },
  },
  'underscore dangle': {
    files: {
      'test.js': endent`
        const foo = {}

        console.log(foo._bar)

      `,
    },
  },
  'html indent': {
    files: {
      'test.vue': endent`
        <template>
          <div
            :is-active="
              $route.name === 'task-view-detail' &&
              $route.params.taskViewId === entity._id
            "
          />
        </template>

      `,
    },
  },
  'async without await': {
    files: {
      'test.js': endent`
        export default async () => console.log('foo')

      `,
    },
    result: [
      {
        filePath: 'test.js',
        messages: ["Async arrow function has no 'await' expression."],
      },
    ],
  },
  'promise then': {
    files: {
      'test.js': endent`
        export default () => Promise.resolve().then(x => x)

      `,
    },
    result: [
      {
        filePath: 'test.js',
        messages: ['Prefer await to then().'],
      },
    ],
  },
  'destructuring: object': {
    files: {
      'test.js': endent`
        const { foo } = { foo: 'bar' }
        console.log(foo)

      `,
    },
    result: [
      {
        filePath: 'test.js',
        messages: ["Using 'ObjectPattern' is not allowed."],
      },
    ],
  },
  'destructuring: array': {
    files: {
      'test.js': endent`
        const [foo] = ['bar']
        console.log(foo)

      `,
    },
    result: [
      {
        filePath: 'test.js',
        messages: ["Using 'ArrayPattern' is not allowed."],
      },
    ],
  },
  'destructuring: parameter': {
    files: {
      'test.js': endent`
        export default ({ foo }) => console.log(foo)

      `,
    },
    result: [
      {
        filePath: 'test.js',
        messages: ["Using 'ObjectPattern' is not allowed."],
      },
    ],
  },
  'possible destructuring': {
    files: {
      'test.js': endent`
        const bar = { foo: 'test' }
        const foo = bar.foo
        console.log(foo)

      `,
    },
  },
  'nullish coalescing': {
    files: {
      'test.js': endent`
        console.log(1 ?? 2)

      `,
    },
    result: [
      {
        filePath: 'test.js',
        messages: ["Using 'LogicalExpression[operator='??']' is not allowed."],
      },
    ],
  },
} |> mapValues(runTest)
