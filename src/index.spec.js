import { endent } from '@dword-design/functions'
import execa from 'execa'
import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'

const eslint = (files, { nodeEnv } = {}) => withLocalTmpDir(async () => {
  await outputFiles(files)
  try {
    await execa('eslint', ['--config', require.resolve('.'), '--ext', '.js,.json', '.'], { all: true, env: { ...process.env, NODE_ENV: nodeEnv } })
    return ''
  } catch ({ all }) {
    return all
  }
})

export default {
  'dev dependency in root': async () => expect(
    await eslint({
      'node_modules/foo/index.js': 'export default 1',
      'package.json': JSON.stringify({
        devDependencies: {
          foo: '^1.0.0',
        },
      }, undefined, 2),
      'index.js': endent`
        import foo from 'foo'

        console.log(foo)
      `,
    }),
  )
    .toMatch('error  \'foo\' should be listed in the project\'s dependencies, not devDependencies'),
  'dev dependency in source': async () => expect(
    await eslint({
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
    }),
  )
    .toMatch('error  \'foo\' should be listed in the project\'s dependencies, not devDependencies'),
  'indent: valid': async () => expect(
    await eslint({
      'test.js': endent`
        export default () => {
          console.log('foo')
        }

      `,
    }),
  )
    .toEqual(''),
  'indent: invalid': async () => expect(
    await eslint({
      'test.txt': endent`
        export default () => {
            console.log('foo')
        }
      `,
    }),
  )
    .toMatch('You are linting ".", but all of the files matching the glob pattern "." are ignored.'),
  'json: valid': async () => expect(
    await eslint({
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
    }),
  )
    .toEqual(''),
  'json: syntax error': async () => expect(
    await eslint({
      'test.json': endent`
        {
          "foo":
        }
      `,
    }),
  )
    .toMatch('error  Unexpected token'),
  'json: no indent': async () => expect(
    await eslint({
      'test.json': endent`
        {
        "foo": "bar"
        }
      `,
    }),
  )
    .toMatch('error  Format Error: expected "  "'),
  'json: indent too big': async () => expect(
    await eslint({
      'test.json': endent`
        {
            "foo": "bar"
        }
      `,
    }),
  )
    .toMatch('error  Format Error: unexpected "  "'),
  'jsx: with var': async () => expect(
    await eslint({
      'test.js': endent`
      const Foo = <div>Hello world</div>
      export default (
        <div>
          <Foo />
        </div>
      )

    `,
    }),
  )
    .toEqual(''),
  'jsx: valid': async () => expect(
    await eslint({
      'test.js': endent`
        export default <div>Hello world</div>
        
      `,
    }),
  )
    .toEqual(''),
  'package.json: valid': async () => expect(
    await eslint({
      'package.json': endent`
        {
          "name": "foo",
          "version": "1.0.0"
        }
      `,
    }),
  )
    .toEqual(''),
  'package.json: unsorted': async () => expect(
    await eslint({
      'package.json': endent`
        {
          "version": "1.0.0",
          "name": "foo"
        }
      `,
    }),
  )
    .toMatch('error  JSON is not sorted'),
  'prefer-arrow': async () => {
    expect(await eslint({
      'test.js': endent`
        export default () => console.log('foo')

      `,
    })).toEqual('')
    expect(await eslint({
      'test.js': endent`
        export default function () { console.log('foo') }

      `,
    }))
      .toMatch('error  Prefer using arrow functions over plain functions')
  },
  'prod dependency in src': async () => expect(
    await eslint({
      'node_modules/foo/index.js': endent`
        export default 1
        
      `,
      'package.json': JSON.stringify({
        dependencies: {
          foo: '^1.0.0',
        },
      }, undefined, 2),
      'src/index.js': endent`
        import foo from 'foo'

        console.log(foo)

      `,
    }),
  )
    .toEqual(''),
  'regex-spaces': async () => expect(
    await eslint({
      'test.js': endent`
        export default /  /

      `,
    }),
  ).toEqual(''),
  'restricted import: inside': async () => expect(
    await eslint({
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
    }),
  )
    .toEqual(''),
  'restricted import: outside': async () => expect(
    await eslint({
      'test.js': endent`
        import puppeteer from 'puppeteer'
        console.log(puppeteer)

      `,
    }),
  )
    .toMatch('\'puppeteer\' import is restricted from being used. Please use \'@dword-design/puppeteer\' instead'),
  semicolon: async () => {
    expect(await eslint({
      'test.js': endent`
        console.log()
      
      `,
    })).toEqual('')
    expect(await eslint({
      'test.js': endent`
        console.log();

      `,
    })).toMatch('error  Delete `;`  prettier/prettier')
  },
  'test: dev dependency': async () => expect(
    await eslint({
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
    }),
  )
    .toEqual(''),
  'test: restricted import': async () => expect(
    await eslint({
      'src/index.spec.js': endent`
        import puppeteer from 'puppeteer'
        console.log(puppeteer)

      `,
    }),
  )
    .toMatch('\'puppeteer\' import is restricted from being used. Please use \'@dword-design/puppeteer\' instead'),
  'test: imported expect': async () => expect(
    await eslint({
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
    }),
  )
    .toMatch('\'expect\' import is restricted from being used. Please use the global \'expect\' variable instead'),
  'test: global expect': async () => expect(await eslint({
    'src/index.spec.js': endent`
      expect(1).toEqual(1)
      
    `,
  })).toEqual(''),
  'test: prod dependency': async () => expect(
    await eslint({
      'node_modules/foo/index.js': endent`
        export default 1
        
      `,
      'package.json': JSON.stringify({
        dependencies: {
          foo: '^1.0.0',
        },
      }, undefined, 2),
      'src/index.spec.js': endent`
        import foo from 'foo'

        console.log(foo)

      `,
    }),
  )
    .toEqual(''),
  'quotes: nested': async () => expect(
    await eslint({
      'test.js': endent`
        export default "foo 'bar'"

      `,
    }),
  )
    .toEqual(''),
  'quotes: unnecessary escapes': async () => expect(
    await eslint({
      'test.js': endent`
        export default 'foo \\'bar\\''

      `,
    }),
  )
    .toMatch('Replace `\'foo·\\\'bar\\\'\'` with `"foo·\'bar\'"`'),
  'arrow function block': async () => expect(
    await eslint({
      'test.js': endent`
        export default foo => {
          console.log(foo)
        }

      `,
    }),
  )
    .toEqual(''),
  'pipeline operator': async () => expect(
    await eslint({
      'test.js': endent`
        export default async () => 1 |> (x => x + 1) |> await
      `,
    }),
  )
    .toEqual(''),
  'deep nesting': async () => expect(
    await eslint({
      'test.js': endent`
        export default async () => console.log(() => (1 + 2 + 3 + 4) * 3 + 5)
      `,
    }),
  )
    .toMatch('error  Insert `⏎`  prettier/prettier'),
}
