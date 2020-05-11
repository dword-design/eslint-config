import { endent, mapValues } from '@dword-design/functions'
import execa from 'execa'
import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'

const runTest = ({ files, match = '' }) => () =>
  withLocalTmpDir(async () => {
    await outputFiles({
      ...files,
      '.eslintrc.json': JSON.stringify(
        {
          extends: require.resolve('.'),
        },
        undefined,
        2
      ),
    })
    try {
      const { all } = await execa('eslint', ['--ext', '.js,.json', '.'], {
        all: true,
      })
      expect(all).toBeFalsy()
    } catch (error) {
      if (match) {
        expect(error.all).toMatch(match)
      } else {
        throw error
      }
    }
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
    match:
      "'foo' should be listed in the project's dependencies, not devDependencies",
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
    match:
      "'foo' should be listed in the project's dependencies, not devDependencies",
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
    match: 'Delete `··`  prettier/prettier',
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
    match: 'Unexpected token',
  },
  'json: no indent': {
    files: {
      'test.json': endent`
        {
        "foo": "bar"
        }
      `,
    },
    match: 'Format Error: expected "  "',
  },
  'json: indent too big': {
    files: {
      'test.json': endent`
      {
          "foo": "bar"
      }
    `,
    },
    match: 'Format Error: unexpected "  "',
  },
  'jsx: with var': {
    files: {
      'test.js': endent`
        const Foo = <div>Hello world</div>
        export default (
          <div>
            <Foo />
          </div>
        )

      `,
    },
  },
  'jsx: valid': {
    files: {
      'test.js': endent`
        export default <div>Hello world</div>
        
      `,
    },
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
    match: 'JSON is not sorted',
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
        export default function () { console.log('foo') }

      `,
    },
    match: 'Prefer using arrow functions over plain functions',
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
        import puppeteer from 'puppeteer'

        console.log(puppeteer)

      `,
    },
  },
  'restricted import: outside': {
    files: {
      'test.js': endent`
        import puppeteer from 'puppeteer'
        console.log(puppeteer)

      `,
    },
    match:
      "'puppeteer' import is restricted from being used. Please use '@dword-design/puppeteer' instead",
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
    match: 'error  Delete `;`',
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
      'src/index.spec.js': endent`
        import puppeteer from 'puppeteer'
        console.log(puppeteer)

      `,
    },
    match:
      "'puppeteer' import is restricted from being used. Please use '@dword-design/puppeteer' instead",
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
    match:
      "'expect' import is restricted from being used. Please use the global 'expect' variable instead",
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
    match: "Replace `'foo·\\'bar\\''` with `\"foo·'bar'\"`",
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
        export default async () => console.log(() => (1 + 2 + 3 + 4) * 3 + 5)
      `,
    },
    match: 'error  Insert `⏎`',
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
        export default ({ foo }) => {
          foo = 'bar'
          console.log(foo)
        }

      `,
    },
  },
} |> mapValues(runTest)
