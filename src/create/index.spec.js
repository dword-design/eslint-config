import P from 'node:path';

import dedent from 'dedent';
import packageName from 'depcheck-package-name';
import { ESLint } from 'eslint';
import inFolder from 'in-folder';
import { mapValues, pick } from 'lodash-es';
import outputFiles from 'output-files';
import withLocalTmpDir from 'with-local-tmp-dir';

import self from './index.js';

const runTest = config => () => {
  config = {
    cwd: '.',
    eslintConfig: {},
    filename: 'index.js',
    messages: [],
    ...config,
  };

  config.output = config.output || config.code;
  return withLocalTmpDir(async () => {
    await outputFiles({
      'babel.config.json': JSON.stringify({
        extends: '@dword-design/babel-config',
      }),
      'package.json': JSON.stringify({ type: 'module' }),
      ...config.files,
      [config.filename]: config.code,
    });

    return inFolder(config.cwd, async () => {
      const eslintConfig = {
        baseConfig: self(),
        overrideConfig: config.eslintConfig,
        overrideConfigFile: true,
      };

      const eslintToLint = new ESLint(eslintConfig);
      const eslintToFix = new ESLint({ ...eslintConfig, fix: true });

      const lintResult = await eslintToLint.lintText(config.code, {
        filePath: config.filename,
      });

      const lintedMessages = lintResult
        .flatMap(_ => _.messages)
        .map(_ => pick(_, ['message', 'ruleId']));

      expect(lintedMessages).toEqual(config.messages);

      const outputResult = await eslintToFix.lintText(config.code, {
        filePath: config.filename,
      });

      const lintedOutput = outputResult.map(_ => _.output).join('\n');
      expect(lintedOutput || config.code).toEqual(config.output);
    });
  });
};

export default mapValues(
  {
    'alias: child': {
      code: "import '@/foo.js';\n",
      files: { 'foo.js': '' },
      messages: [
        {
          message:
            "Unexpected subpath import via alias '@/foo.js'. Use './foo.js' instead",
          ruleId: '@dword-design/import-alias/prefer-alias',
        },
      ],
      output: "import './foo.js';\n",
    },
    'alias: parent': {
      code: "import '@/foo.js';\n",
      filename: P.join('sub', 'index.js'),
      files: { 'foo.js': '' },
    },
    'alias: parent import': {
      code: "import '../foo.js';\n",
      filename: P.join('sub', 'sub', 'index.js'),
      files: {
        '.babelrc.json': JSON.stringify({
          extends: packageName`@dword-design/babel-config`,
        }),
        sub: { 'foo.js': '' },
      },
      messages: [
        {
          message:
            "Unexpected parent import '../foo.js'. Use '@/sub/foo.js' instead",
          ruleId: '@dword-design/import-alias/prefer-alias',
        },
      ],
      output: "import '@/sub/foo.js';\n",
    },
    'arrow function': { code: "export default () => console.log('foo');\n" },
    'arrow function assignment': {
      code: "export default foo => (foo.bar = 'bar');\n",
    },
    'arrow function block': {
      code: dedent`
        export default foo => {
          console.log(foo);
        };\n
      `,
    },
    'arrow function returning block': {
      code: dedent`
        export default foo => {
          return console.log(foo);
        };\n
      `,
      messages: [
        {
          message:
            'Unexpected block statement surrounding arrow body; move the returned value immediately after the `=>`.',
          ruleId: 'arrow-body-style',
        },
      ],
      output: 'export default foo => console.log(foo);\n',
    },
    'arrow function with unneeded parens': {
      code: 'export default (foo) => foo;\n',
      messages: [
        { message: 'Replace `(foo)` with `foo`', ruleId: 'prettier/prettier' },
      ],
      output: 'export default foo => foo;\n',
    },
    'arrow function without parens': { code: 'export default foo => foo;\n' },
    'async without await': {
      code: "export default async () => console.log('foo');\n",
      messages: [
        {
          message: "Async arrow function has no 'await' expression.",
          ruleId: 'require-await',
        },
      ],
    },
    'await inside loop': {
      code: dedent`
        for (let i = 0; i < 10; i += 1) {
          await Promise.resolve();
        }\n
      `,
    },
    'blank line: between exports: no': {
      code: dedent`
        export const foo = 1;
        export const bar = 2;\n
      `,
      messages: [
        {
          message: 'Expected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        export const foo = 1;

        export const bar = 2;\n
      `,
    },
    'blank line: between single-line statements: no': {
      code: dedent`
        console.log('foo');
        console.log('bar');\n
      `,
    },
    'blank line: between single-line statements: yes': {
      code: dedent`
        console.log('foo');

        console.log('bar');\n
      `,
      messages: [
        {
          message: 'Unexpected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        console.log('foo');
        console.log('bar');\n
      `,
    },
    'blank line: between statement and export: no': {
      code: dedent`
        console.log('foo');
        export const foo = 1;\n
      `,
      messages: [
        {
          message: 'Expected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        console.log('foo');

        export const foo = 1;\n
      `,
    },
    'blank line: import and statement: no': {
      code: dedent`
        import foo from 'foo';
        console.log(foo);\n
      `,
      files: {
        'node_modules/foo/index.js': '',
        'package.json': JSON.stringify(
          { dependencies: { foo: '^1.0.0' } },
          undefined,
          2,
        ),
      },
      messages: [
        {
          message: 'Expected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        import foo from 'foo';

        console.log(foo);\n
      `,
    },
    'blank line: import and statement: yes': {
      code: dedent`
        import foo from 'foo';

        console.log(foo);\n
      `,
      files: {
        'node_modules/foo/index.js': '',
        'package.json': JSON.stringify(
          { dependencies: { foo: '^1.0.0' } },
          undefined,
          2,
        ),
      },
    },
    'blank line: import groups with newline': {
      code: dedent`
        import foo from 'foo';

        import bar from './bar.js';

        console.log(foo);
        console.log(bar);\n
      `,
      files: {
        'bar.js': 'export default 1;\n',
        'node_modules/foo/index.js': '',
        'package.json': JSON.stringify(
          { dependencies: { foo: '^1.0.0' }, type: 'module' },
          undefined,
          2,
        ),
      },
    },
    'blank line: import groups without newline': {
      code: dedent`
        import foo from 'foo';
        import bar from './bar.js';

        console.log(foo);
        console.log(bar);\n
      `,
      files: {
        'bar.js': 'export default 1;\n',
        'node_modules/foo/index.js': '',
        'package.json': JSON.stringify(
          { dependencies: { foo: '^1.0.0' }, type: 'module' },
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
      output: dedent`
        import foo from 'foo';

        import bar from './bar.js';

        console.log(foo);
        console.log(bar);\n
      `,
    },
    'blank line: imports with newline': {
      code: dedent`
        import bar from './bar.js';

        import foo from './foo.js';

        console.log(foo);
        console.log(bar);\n
      `,
      files: {
        'bar.js': "export default 'bar';\n",
        'foo.js': "export default 'foo';\n",
      },
      messages: [
        {
          message: 'Run autofix to sort these imports!',
          ruleId: 'simple-import-sort/imports',
        },
      ],
      output: dedent`
        import bar from './bar.js';
        import foo from './foo.js';

        console.log(foo);
        console.log(bar);\n
      `,
    },
    'blank line: imports without newline': {
      code: dedent`
        import bar from './bar.js';
        import foo from './foo.js';

        console.log(bar);
        console.log(foo);\n
      `,
      files: {
        'bar.js': "export default 'bar';\n",
        'foo.js': "export default 'foo';\n",
      },
    },
    'blank line: multi-line block: after: no': {
      code: dedent`
        const foo = 1;

        if (foo) {
          console.log('foo');
        }
        console.log('foo');\n
      `,
      messages: [
        {
          message: 'Expected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        const foo = 1;

        if (foo) {
          console.log('foo');
        }

        console.log('foo');\n
      `,
    },
    'blank line: multi-line block: after: yes': {
      code: dedent`
        const foo = 1;

        if (foo) {
          console.log('foo');
        }

        console.log('foo');\n
      `,
    },
    'blank line: multi-line block: before: no': {
      code: dedent`
        const foo = true;
        if (foo) {
          console.log('foo');
        }\n
      `,
      messages: [
        {
          message: 'Expected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        const foo = true;

        if (foo) {
          console.log('foo');
        }\n
      `,
    },
    'blank line: multi-line block: before: yes': {
      code: dedent`
        const foo = true;

        if (foo) {
          console.log('foo');
        }\n
      `,
    },
    'blank line: multi-line const declaration: after: no': {
      code: dedent`
        const foo = {
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        };
        console.log(foo);\n
      `,
      messages: [
        {
          message: 'Expected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        const foo = {
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        };

        console.log(foo);\n
      `,
    },
    'blank line: multi-line const declaration: after: yes': {
      code: dedent`
        const foo = {
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        };

        console.log(foo);\n
      `,
    },
    'blank line: multi-line const declaration: before: no': {
      code: dedent`
        console.log('foo');
        const foo = {
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        };

        console.log(foo);\n
      `,
      messages: [
        {
          message: 'Expected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        console.log('foo');

        const foo = {
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        };

        console.log(foo);\n
      `,
    },
    'blank line: multi-line const declaration: before: yes': {
      code: dedent`
        console.log('foo');

        const foo = {
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        };

        console.log(foo);\n
      `,
    },
    'blank line: multi-line let declaration: after: no': {
      code: dedent`
        let foo = {
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        };
        foo = 1;
        console.log(foo);\n
      `,
      messages: [
        {
          message: 'Expected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        let foo = {
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        };

        foo = 1;
        console.log(foo);\n
      `,
    },
    'blank line: multi-line let declaration: after: yes': {
      code: dedent`
        let foo = {
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        };

        foo = 1;
        console.log(foo);\n
      `,
    },
    'blank line: multi-line let declaration: before: no': {
      code: dedent`
        console.log('foo');
        let foo = {
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        };

        foo = 1;
        console.log(foo);\n
      `,
      messages: [
        {
          message: 'Expected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        console.log('foo');

        let foo = {
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        };

        foo = 1;
        console.log(foo);\n
      `,
    },
    'blank line: multi-line let declaration: before: yes': {
      code: dedent`
        console.log('foo');

        let foo = {
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        };

        foo = 1;
        console.log(foo);\n
      `,
    },
    'blank line: multi-line statement: after: no': {
      code: dedent`
        console.log({
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        });
        console.log('foo');\n
      `,
      messages: [
        {
          message: 'Expected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        console.log({
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        });

        console.log('foo');\n
      `,
    },
    'blank line: multi-line statement: after: yes': {
      code: dedent`
        console.log({
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        });

        console.log('foo');\n
      `,
    },
    'blank line: multi-line statement: before: no': {
      code: dedent`
        console.log('foo');
        console.log({
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        });\n
      `,
      messages: [
        {
          message: 'Expected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        console.log('foo');

        console.log({
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        });\n
      `,
    },
    'blank line: multi-line statement: before: yes': {
      code: dedent`
        console.log('foo');

        console.log({
          foo: 'Aenean eu leo quam. Pellentesque ornare sem. Aenean eu leo quam. Pellentesque ornare sem.',
        });\n
      `,
    },
    'blank line: newline between exports': {
      code: dedent`
        export const foo = 1;

        export const bar = 2;\n
      `,
    },
    'blank line: newline between statement and export': {
      code: dedent`
        console.log('foo');

        export const foo = 1;\n
      `,
    },
    callbacks: {
      code: dedent`
        const foo = () => {};

        foo(async error => {
          await console.log(error);
        });\n
      `,
    },
    'chained arrow functions': { code: 'export default () => () => 1;\n' },
    'comments: with blank line': {
      code: dedent`
        console.log('foo');

        // foo
        console.log('bar');\n
      `,
      messages: [
        {
          message: 'Unexpected blank line before this statement.',
          ruleId: 'padding-line-between-statements',
        },
      ],
      output: dedent`
        console.log('foo');
        // foo
        console.log('bar');\n
      `,
    },
    'comments: without blank line': {
      code: dedent`
        console.log('foo');
        // foo
        console.log('bar');\n
      `,
    },
    continue: {
      code: dedent`
        for (let i = 0; i < 10; i += 1) {
          if (i > 5) {
            continue;
          }
  
          console.log(i);
        }\n
      `,
    },
    'deep nesting': {
      code: 'export default () => console.log(() => (1 + 2 + 3 + 4) * 3 + 5 + 3 + 5 + 56 + 123 + 55_456 + 23_434 + 23_434);\n',
      messages: [
        {
          message:
            'Replace `·console.log(()·=>·(1·+·2·+·3·+·4)·*·3·+·5·+·3·+·5·+·56·+·123·+·55_456·+·23_434·+·23_434` with `⏎··console.log(⏎····()·=>·(1·+·2·+·3·+·4)·*·3·+·5·+·3·+·5·+·56·+·123·+·55_456·+·23_434·+·23_434,⏎··`',
          ruleId: 'prettier/prettier',
        },
      ],
      output: dedent`
        export default () =>
          console.log(
            () => (1 + 2 + 3 + 4) * 3 + 5 + 3 + 5 + 56 + 123 + 55_456 + 23_434 + 23_434,
          );\n
      `,
    },
    'destructuring: array Promise.all': {
      code: dedent`
        const [foo, bar] = await Promise.all([]);
        console.log(foo);
        console.log(bar);\n
      `,
    },
    'destructuring: array for loop Object.entries': {
      code: dedent`
        for (const [foo, bar] of Object.entries({})) {
          console.log(foo);
          console.log(bar);
        }\n
      `,
    },
    'destructuring: parameter': {
      code: 'export default ({ foo }) => console.log(foo);\n',
    },
    'destructuring: return values': {
      code: dedent`
        const func = () => ({ x: 1, y: 2 });
        const { x, y } = func();
        console.log(x);
        console.log(y);\n
      `,
    },
    'dev dependency in global-test-hooks.js: mocha': {
      code: "import 'foo';\n",
      filename: 'global-test-hooks.js',
      files: {
        'node_modules/foo': {
          'index.js': '',
          'package.json': JSON.stringify({ name: 'foo' }),
        },
        'package.json': JSON.stringify({ devDependencies: { foo: '^1.0.0' } }),
      },
    },
    'dev dependency in global-test-hooks.js: playwright': {
      code: "import 'foo';\n",
      filename: 'global-test-hooks.js',
      files: {
        '.baserc.json': JSON.stringify({ testRunner: 'playwright' }),
        'node_modules/foo': {
          'index.js': '',
          'package.json': JSON.stringify({ name: 'foo' }),
        },
        'package.json': JSON.stringify({ devDependencies: { foo: '^1.0.0' } }),
      },
      messages: [
        {
          message:
            "'foo' should be listed in the project's dependencies, not devDependencies.",
          ruleId: 'import/no-extraneous-dependencies',
        },
      ],
    },
    'dev dependency in playwright.config.js: mocha': {
      code: "import 'foo';\n",
      filename: 'playwright.config.js',
      files: {
        'node_modules/foo': {
          'index.js': '',
          'package.json': JSON.stringify({ name: 'foo' }),
        },
        'package.json': JSON.stringify({ devDependencies: { foo: '^1.0.0' } }),
      },
      messages: [
        {
          message:
            "'foo' should be listed in the project's dependencies, not devDependencies.",
          ruleId: 'import/no-extraneous-dependencies',
        },
      ],
    },
    'dev dependency in playwright.config.js: playwright': {
      code: "import 'foo';\n",
      filename: 'playwright.config.js',
      files: {
        '.baserc.json': JSON.stringify({ testRunner: 'playwright' }),
        'node_modules/foo': {
          'index.js': '',
          'package.json': JSON.stringify({ name: 'foo' }),
        },
        'package.json': JSON.stringify({ devDependencies: { foo: '^1.0.0' } }),
      },
    },
    'dev dependency in root': {
      code: "import 'foo';\n",
      files: {
        'node_modules/foo': {
          'index.js': '',
          'package.json': JSON.stringify({ name: 'foo' }),
        },
        'package.json': JSON.stringify(
          { devDependencies: { foo: '^1.0.0' } },
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
      code: "import 'foo';\n",
      filename: P.join('src', 'index.js'),
      files: {
        'node_modules/foo': {
          'index.js': '',
          'package.json': JSON.stringify({ name: 'foo' }),
        },
        'package.json': JSON.stringify(
          { devDependencies: { foo: '^1.0.0' } },
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
      code: "import 'foo';\n",
      filename: 'index.spec.js',
      files: {
        'node_modules/foo/index.js': '',
        'package.json': dedent`
          {
            "devDependencies": {
              "foo": "^1.0.0"
            }
          }
        `,
      },
    },
    'empty object pattern > playwright: no': {
      code: 'export default ({}) => {};\n',
      filename: 'index.spec.js',
      messages: [
        {
          message: 'Unexpected empty object pattern.',
          ruleId: 'no-empty-pattern',
        },
      ],
    },
    'empty object pattern > playwright: yes > test file: no': {
      code: dedent`
        import { test as base } from '${packageName`@playwright/test`}';

        export const test = base.extend({ _: [({}, use) => use(), { auto: true }] });\n
      `,
      files: {
        '.baserc.json': JSON.stringify({ testRunner: 'playwright' }),
        'package.json': JSON.stringify({
          dependencies: { [packageName`@playwright/test`]: '*' },
        }),
      },
      messages: [
        {
          message: 'Unexpected empty object pattern.',
          ruleId: 'no-empty-pattern',
        },
      ],
    },
    'empty object pattern > playwright: yes > test file: yes': {
      code: dedent`
        import { test as base } from '${packageName`@playwright/test`}';

        const test = base.extend({ _: [({}, use) => use(), { auto: true }] });
        test('foo', () => {});\n
      `,
      filename: 'index.spec.js',
      files: {
        '.baserc.json': JSON.stringify({ testRunner: 'playwright' }),
        'package.json': JSON.stringify({
          devDependencies: { [packageName`@playwright/test`]: '*' },
        }),
      },
    },
    'esm import without main field': {
      code: "import 'foo';\n",
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
    'file extension: alias: existing': {
      code: "import '@/foo.js';\n",
      filename: P.join('sub', 'index.js'),
      files: { 'foo.js': '' },
    },
    'file extension: alias: missing': {
      code: "import '@/foo';\n",
      filename: P.join('sub', 'index.js'),
      files: { 'foo.js': '' },
      messages: [
        {
          message: 'Missing file extension "js" for "@/foo"',
          ruleId: 'import/extensions',
        },
      ],
    },
    'file extension: scoped package: existing': {
      code: "import '@foo/bar.js';\n",
      files: {
        'node_modules/@foo/bar': {
          'index.js': '',
          'package.json': JSON.stringify({ name: '@foo/bar' }),
        },
        'package.json': JSON.stringify({
          dependencies: { '@foo/bar': '*' },
          type: 'module',
        }),
      },
      messages: [
        {
          message: "Unable to resolve path to module '@foo/bar.js'.",
          ruleId: 'import/no-unresolved',
        },
      ],
    },
    'file extension: scoped package: missing': {
      code: "import '@foo/bar';\n",
      files: {
        'node_modules/@foo/bar': {
          'index.js': '',
          'package.json': JSON.stringify({ name: '@foo/bar' }),
        },
        'package.json': JSON.stringify({
          dependencies: { '@foo/bar': '*' },
          type: 'module',
        }),
      },
    },
    'file extension: subpath: existing': {
      code: "import './foo.js';\n",
      files: { 'foo.js': '' },
    },
    'file extension: subpath: missing': {
      code: "import './foo';\n",
      files: { 'foo.js': '' },
      messages: [
        {
          message: 'Missing file extension "js" for "./foo"',
          ruleId: 'import/extensions',
        },
      ],
    },
    forEach: {
      code: dedent`
        const foo = [];
        foo.forEach(() => {});\n
      `,
      messages: [
        {
          message: 'Use `for…of` instead of `.forEach(…)`.',
          ruleId: 'unicorn/no-array-for-each',
        },
      ],
    },
    'function block': {
      code: dedent`
        export default function () {
          console.log('foo');
        }\n
      `,
      messages: [
        {
          message: 'Prefer using arrow functions over plain functions',
          ruleId: 'prefer-arrow/prefer-arrow-functions',
        },
      ],
    },
    'function style expression with string literal': {
      code: dedent`
        export default {
          'foo bar': function () {
            console.log(this);
          },
        };\n
      `,
      messages: [
        { message: 'Expected method shorthand.', ruleId: 'object-shorthand' },
      ],
      output: dedent`
        export default {
          'foo bar'() {
            console.log(this);
          },
        };\n
      `,
    },
    'functional in template': {
      code: dedent`
        <template functional>
          <div />
        </template>\n
      `,
      filename: 'index.vue',
      messages: [
        {
          message: 'The `functional` template are deprecated.',
          ruleId: 'vue/no-deprecated-functional-template',
        },
      ],
    },
    globalThis: { code: 'console.log(globalThis);\n' },
    'import order': {
      code: dedent`
        import foo from 'foo';
        import bar from 'bar';

        console.log(foo);
        console.log(bar);\n
      `,
      files: {
        'node_modules/bar/index.js': '',
        'node_modules/foo/index.js': '',
        'package.json': JSON.stringify(
          { dependencies: { bar: '^1.0.0', foo: '^1.0.0' } },
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
      output: dedent`
        import bar from 'bar';
        import foo from 'foo';

        console.log(foo);
        console.log(bar);\n
      `,
    },
    'import order with webpack loader syntax and aliases': {
      code: dedent`
        import buyMeACoffeeImageUrl from '!url-loader!@/buymeacoffee.svg';
        import imageUrl from '@/support-me.jpg';

        console.log(imageUrl);
        console.log(buyMeACoffeeImageUrl);\n
      `,
      eslintConfig: { rules: { 'import/no-webpack-loader-syntax': 'off' } },
      filename: P.join('sub', 'index.js'),
      files: { 'buymeacoffee.svg': '', 'support-me.jpg': '' },
    },
    'indent: invalid': {
      code: dedent`
        export default () => {
            console.log('foo');
        };\n
      `,
      messages: [{ message: 'Delete `··`', ruleId: 'prettier/prettier' }],
      output: dedent`
        export default () => {
          console.log('foo');
        };\n
      `,
    },
    'indent: valid': {
      code: dedent`
        export default () => {
          console.log('foo');
        };\n
      `,
    },
    'inline comments': { code: 'export default 1; // foo\n' },
    'json: indent too big': {
      code: dedent`
        {
            "foo": "bar"
        }\n
      `,
      filename: 'index.json',
      messages: [
        {
          message: 'Expected indentation of 2 spaces but found 4.',
          ruleId: 'jsonc/indent',
        },
      ],
      output: dedent`
        {
          "foo": "bar"
        }\n
      `,
    },
    'json: no indent': {
      code: dedent`
        {
        "foo": "bar"
        }\n
      `,
      filename: 'index.json',
      messages: [
        {
          message: 'Expected indentation of 2 spaces but found 0.',
          ruleId: 'jsonc/indent',
        },
      ],
      output: dedent`
        {
          "foo": "bar"
        }\n
      `,
    },
    'json: syntax error': {
      code: dedent`
        {
          "foo":
        }\n
      `,
      filename: 'index.json',
      messages: [
        { message: "Parsing error: Unexpected token '}'.", ruleId: null },
      ],
    },
    'json: valid': {
      code: dedent`
        {
          "bar": {
            "baz": [
              "test",
              "test2"
            ]
          },
          "foo": "bar"
        }\n
      `,
      filename: 'index.json',
    },
    'lonely if': {
      code: dedent`
        export default ({ distanceFromTarget = 30 } = {}) =>
          (rect1, rect2) => {
            const center1 = {
              x: rect1.left + rect1.width / 2,
              y: rect1.top + rect1.height / 2,
            };

            const center2 = {
              x: rect2.left + rect2.width / 2,
              y: rect2.top + rect2.height / 2,
            };

            // Determine if there's a significant horizontal offset
            const dx = center2.x - center1.x;
            const dy = center2.y - center1.y;
            // Use horizontal connection if there's meaningful horizontal distance
            const isHorizontal = Math.abs(dx) > rect1.width / 2 + rect2.width / 2;
            let joinPoint;
            let targetPoint;

            if (isHorizontal) {
              // Connecting horizontally
              if (dx > 0) {
                // rect2 is to the right
                joinPoint = { x: rect2.left - distanceFromTarget, y: center2.y };
                targetPoint = { x: rect2.left, y: center2.y };
              } else {
                // rect2 is to the left
                joinPoint = { x: rect2.right + distanceFromTarget, y: center2.y };
                targetPoint = { x: rect2.right, y: center2.y };
              }
            } else {
              // Connecting vertically
              if (dy > 0) {
                // rect2 is below
                joinPoint = { x: center2.x, y: rect2.top - distanceFromTarget };
                targetPoint = { x: center2.x, y: rect2.top };
              } else {
                // rect2 is above
                joinPoint = { x: center2.x, y: rect2.bottom + distanceFromTarget };
                targetPoint = { x: center2.x, y: rect2.bottom };
              }
            }

            return [center1, { x: joinPoint.x, y: center1.y }, joinPoint, targetPoint];
          };\n
      `,
    },
    'missing trailing comma': {
      code: dedent`
        console.log([
          'fooadfa sdfasdfasdf asdfasdfasdfasdf',
          'adfsddfsdfsadfasdf asdfasdf asdfasdf'
        ]);\n
      `,
      messages: [{ message: 'Insert `,`', ruleId: 'prettier/prettier' }],
      output: dedent`
        console.log([
          'fooadfa sdfasdfasdf asdfasdfasdfasdf',
          'adfsddfsdfsadfasdf asdfasdf asdfasdf',
        ]);\n
      `,
    },
    'multi-root component': {
      code: dedent`
        <template>
          <div />
          <div />
        </template>\n
      `,
      filename: 'index.vue',
    },
    'named as default': {
      code: dedent`
        import foo from 'foo';

        export default foo + 1;\n
      `,
      files: {
        'node_modules/foo/index.js': dedent`
          export const foo = 1;
          export default foo;
        `,
        'package.json': JSON.stringify(
          { dependencies: { foo: '^1.0.0' } },
          undefined,
          2,
        ),
      },
    },
    'named import right order': {
      code: dedent`
        import { bar, foo } from 'foo';

        console.log(bar);
        console.log(foo);\n
      `,
      files: {
        'node_modules/foo/index.js': '',
        'package.json': JSON.stringify(
          { dependencies: { foo: '^1.0.0' } },
          undefined,
          2,
        ),
      },
    },
    'named import wrong order': {
      code: dedent`
        import { foo, bar } from 'foo';

        console.log(foo);
        console.log(bar);\n
      `,
      files: {
        'node_modules/foo/index.js': '',
        'package.json': JSON.stringify(
          { dependencies: { foo: '^1.0.0' } },
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
      output: dedent`
        import { bar, foo } from 'foo';

        console.log(foo);
        console.log(bar);\n
      `,
    },
    'negated condition': {
      code: dedent`
        const foo = 1;

        if (!foo) {
          console.log('foo');
        } else {
          console.log('bar');
        }\n
      `,
      messages: [
        {
          message: 'Unexpected negated condition.',
          ruleId: 'no-negated-condition',
        },
      ],
    },
    'nested ternary': {
      code: 'export default foo => (foo === 1 ? 2 : foo === 2 ? 3 : 4);\n',
    },
    'new lower-case': {
      code: dedent`
        const foo = () => {};

        export default new foo();\n
      `,
    },
    'nullish coalescing': {
      code: dedent`
        const foo = 0;
        console.log(foo ?? 2);\n
      `,
    },
    'object: multi-line that should be multi-line': {
      code: dedent`
        export default {
          foo: 'Maecenas faucibus mollis interdum. Maecenas faucibus mollis interdum. Maecenas faucibus mollis interdum. Maecenas faucibus mollis interdum.',
        };\n
      `,
    },
    'object: multi-line that should be single-line': {
      code: dedent`
        export default {
          foo: 'bar',
        };\n
      `,
      messages: [
        {
          message: "Replace `⏎··foo:·'bar',⏎` with `·foo:·'bar'·`",
          ruleId: 'prettier/prettier',
        },
      ],
      output: "export default { foo: 'bar' };\n",
    },
    'object: single-line that should be multi-line': {
      code: "export default { foo: 'Maecenas faucibus mollis interdum. Maecenas faucibus mollis interdum. Maecenas faucibus mollis interdum. Maecenas faucibus mollis interdum.' };\n",
      messages: [
        {
          message:
            "Replace `·foo:·'Maecenas·faucibus·mollis·interdum.·Maecenas·faucibus·mollis·interdum.·Maecenas·faucibus·mollis·interdum.·Maecenas·faucibus·mollis·interdum.'·` with `⏎··foo:·'Maecenas·faucibus·mollis·interdum.·Maecenas·faucibus·mollis·interdum.·Maecenas·faucibus·mollis·interdum.·Maecenas·faucibus·mollis·interdum.',⏎`",
          ruleId: 'prettier/prettier',
        },
      ],
      output: dedent`
        export default {
          foo: 'Maecenas faucibus mollis interdum. Maecenas faucibus mollis interdum. Maecenas faucibus mollis interdum. Maecenas faucibus mollis interdum.',
        };\n
      `,
    },
    'object: single-line that should be single-line': {
      code: dedent`
        export default { foo: 'bar' };\n
      `,
    },
    'package.json: unsorted': {
      code: dedent`
        {
          "version": "1.0.0",
          "name": "foo"
        }\n
      `,
      filename: 'package.json',
      messages: [
        {
          message:
            "Expected object keys to be in specified order. 'name' should be before 'version'.",
          ruleId: 'jsonc/sort-keys',
        },
      ],
      output: dedent`
        {
          "name": "foo",
          "version": "1.0.0"
        }\n
      `,
    },
    'package.json: valid': {
      code: JSON.stringify({ name: 'foo', version: '1.0.0' }, undefined, 2),
      filename: 'package.json',
    },
    'param reassign': {
      code: dedent`
        export default foo => {
          foo = 'bar';
          console.log(foo);
        };\n
      `,
    },
    pathGroupOverrides: {
      code: "import '#content/server';\n",
      eslintConfig: {
        rules: {
          'import/extensions': [
            'error',
            'always',
            {
              ignorePackages: true,
              pathGroupOverrides: [{ action: 'ignore', pattern: '#*/**' }],
            },
          ],
          'import/no-unresolved': ['error', { ignore: ['#content'] }],
        },
      },
    },
    'possible destructuring': {
      code: dedent`
        const bar = { foo: 'test' };
        const foo = bar.foo;
        console.log(foo);\n
      `,
    },
    'prod dependency in src': {
      code: "import 'foo';\n",
      filename: P.join('src', 'index.js'),
      files: {
        'node_modules/foo/index.js': '',
        'package.json': JSON.stringify({ dependencies: { foo: '^1.0.0' } }),
      },
    },
    'promise catch': {
      // Cannot await catch async long-running processes
      code: 'export default () => Promise.resolve().catch(x => x);\n',
    },
    'quotes: nested': { code: `export default "foo 'bar'";\n` },
    'quotes: unnecessary escapes': {
      code: `export default 'foo \\'bar\\'';\n`,
      messages: [
        {
          message: "Replace `'foo·\\'bar\\''` with `\"foo·'bar'\"`",
          ruleId: 'prettier/prettier',
        },
      ],
      output: `export default "foo 'bar'";\n`,
    },
    'regex-spaces': { code: 'export default /  /;\n' },
    'restricted import: inside': {
      code: "import 'puppeteer';\n",
      files: {
        'node_modules/puppeteer/index.js': '',
        'package.json': dedent`
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
      code: dedent`
        import { zipObject } from '@dword-design/functions';

        console.log(zipObject);\n
      `,
      files: {
        'node_modules/@dword-design/functions/index.js': '',
        'package.json': JSON.stringify(
          { dependencies: { '@dword-design/functions': '^1.0.0' } },
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
      code: "import 'puppeteer';\n",
      files: {
        'node_modules/puppeteer/index.js': '',
        'package.json': JSON.stringify(
          { dependencies: { puppeteer: '^1.0.0' } },
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
      code: 'console.log()\n',
      messages: [{ message: 'Insert `;`', ruleId: 'prettier/prettier' }],
      output: 'console.log();\n',
    },
    'semicolon: yes': { code: 'console.log();\n' },
    'service worker self': {
      code: 'console.log(self.chrome.action);\n',
      messages: [
        {
          message: 'Prefer `globalThis` over `self`.',
          ruleId: 'unicorn/prefer-global-this',
        },
      ],
      output: 'console.log(globalThis.chrome.action);\n',
    },
    'single export': { code: "export const foo = 'bar';\n" },
    'template literal': {
      code: dedent`
        let dedent;

        export default () =>
          dedent\`
          adsfasdf
        \`;\n
      `,
      messages: [
        {
          message: 'Templates should be properly indented.',
          ruleId: 'unicorn/template-indent',
        },
      ],
      output: dedent`
        let dedent;

        export default () =>
          dedent\`
            adsfasdf
          \`;\n
      `,
    },
    'test: global expect': {
      code: 'expect(1).toEqual(1);\n',
      filename: 'index.spec.js',
    },
    'test: imported expect': {
      code: dedent`
        import expect from 'expect';

        expect(1).toEqual(1);\n
      `,
      filename: 'index.spec.js',
      files: {
        'package.json': dedent`
          {
            "devDependencies": {
              "expect": "^1.0.0"
            }
          }\n
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
      code: "import 'foo';\n",
      filename: 'src/index.spec.js',
      files: {
        'node_modules/foo/index.js': '',
        'package.json': JSON.stringify(
          { dependencies: { foo: '^1.0.0' } },
          undefined,
          2,
        ),
      },
    },
    'test: restricted import': {
      code: "import 'puppeteer';\n",
      filename: 'index.spec.js',
      files: {
        'node_modules/puppeteer/index.js': '',
        'package.json': JSON.stringify(
          { dependencies: { puppeteer: '^1.0.0' } },
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
    typescript: {
      code: dedent`
        const foo: string = 'bar';

        export default foo;\n
      `,
      filename: 'index.ts',
    },
    'underscore dangle': {
      code: dedent`
        const foo = {};
        console.log(foo._bar);\n
      `,
    },
    'unnamed function': {
      code: dedent`
        console.log(function () {
          console.log(this);
        });\n
      `,
    },
    'unsorted object keys': {
      code: 'export default { b: 1, a: 2 };\n',
      messages: [
        {
          message:
            "Expected object keys to be in ascending order. 'a' should be before 'b'.",
          ruleId: 'sort-keys-fix/sort-keys-fix',
        },
      ],
      output: 'export default { a: 2, b: 1 };\n',
    },
    'v-html on component': {
      code: dedent`
        <template>
          <foo v-html="html" />
        </template>

        <script>
        export default { computed: { html: () => '<div>foo</div>' } };
        </script>\n
      `,
      filename: 'index.vue',
      messages: [
        {
          message: "Using v-html on component may break component's content.",
          ruleId: 'vue/no-v-text-v-html-on-component',
        },
        {
          message: "'v-html' directive can lead to XSS attack.",
          ruleId: 'vue/no-v-html',
        },
      ],
    },
    'v-html on native element': {
      code: dedent`
        <template>
          <span v-html="html" />
        </template>

        <script>
        export default { computed: { html: () => '<div>foo</div>' } };
        </script>\n
      `,
      filename: 'index.vue',
      messages: [
        {
          message: "'v-html' directive can lead to XSS attack.",
          ruleId: 'vue/no-v-html',
        },
      ],
    },
    valid: { code: 'export default 1;\n' },
    var: {
      code: dedent`
        var foo = 1;
        foo = 2;
        console.log(foo);\n
      `,
      messages: [
        {
          message: 'Unexpected var, use let or const instead.',
          ruleId: 'no-var',
        },
      ],
      output: dedent`
        let foo = 1;
        foo = 2;
        console.log(foo);\n
      `,
    },
    'vue: attributes not sorted': {
      code: dedent`
        <template>
          <div class="foo" aria-hidden="true" />
        </template>\n
      `,
      filename: 'index.vue',
      messages: [
        {
          message: 'Attribute "aria-hidden" should go before "class".',
          ruleId: 'vue/attributes-order',
        },
      ],
      output: dedent`
        <template>
          <div aria-hidden="true" class="foo" />
        </template>\n
      `,
    },
    'vue: component order: invalid': {
      code: dedent`
        <script>
        export default { props: { foo: {} }, data: () => ({ bar: 1 }) };
        </script>\n
      `,
      filename: 'index.vue',
      messages: [
        {
          message:
            "Expected object keys to be in ascending order. 'data' should be before 'props'.",
          ruleId: 'sort-keys-fix/sort-keys-fix',
        },
      ],
      output: dedent`
        <script>
        export default { data: () => ({ bar: 1 }), props: { foo: {} } };
        </script>\n
      `,
    },
    'vue: component order: valid': {
      code: dedent`
        <script>
        export default { data: () => ({ bar: 1 }), props: { foo: {} } };
        </script>\n
      `,
      filename: 'index.vue',
    },
    'vue: index component name': {
      code: dedent`
        <template>
          <div />
        </template>\n
      `,
      filename: P.join('src', 'index.vue'),
    },
    'vue: multi-word component name': {
      code: dedent`
        <template>
          <div />
        </template>\n
      `,
      filename: 'index.vue',
    },
    'vue: page single-word name': {
      code: dedent`
        <template>
          <div />
        </template>\n
      `,
      filename: P.join('pages', 'about.vue'),
    },
    'vue: single-word component name in library': {
      code: dedent`
        <template>
          <div />
        </template>\n
      `,
      filename: P.join('src', 'button.vue'),
    },
    'vue: single-word component registered': {
      code: dedent`
        import Vue from 'vue';

        Vue.component('Foo', {});\n
      `,
      files: {
        'node_modules/vue/index.js': '',
        'package.json': `${JSON.stringify({ dependencies: { vue: '*' } })}\n`,
      },
      messages: [
        {
          message: 'Component name "Foo" should always be multi-word.',
          ruleId: 'vue/multi-word-component-names',
        },
      ],
    },
    'vue: valid': {
      code: dedent`
        <template>
          <div aria-hidden="true" class="foo" />
        </template>\n
      `,
      filename: 'index.vue',
    },
    'while true': {
      code: dedent`
        while (true) {
          console.log('foo');
        }\n
      `,
    },
    window: {
      code: 'console.log(window);\n',
      messages: [
        {
          message: 'Prefer `globalThis` over `window`.',
          ruleId: 'unicorn/prefer-global-this',
        },
      ],
      output: 'console.log(globalThis);\n',
    },
  },
  runTest,
);
