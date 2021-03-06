import { endent, flatten, map, mapValues, pick } from '@dword-design/functions'
import deepmerge from 'deepmerge'
import packageName from 'depcheck-package-name'
import { ESLint } from 'eslint'
import outputFiles from 'output-files'
import P from 'path'
import sortKeys from 'sort-keys'
import stealthyRequire from 'stealthy-require-no-leak'
import withLocalTmpDir from 'with-local-tmp-dir'

const runTest = config => () => {
  config = { eslintConfig: {}, filename: 'index.js', messages: [], ...config }

  return withLocalTmpDir(async () => {
    await outputFiles({
      '.babelrc.json': JSON.stringify({
        extends: '@dword-design/babel-config',
      }),
      'package.json': JSON.stringify({}),
      ...config.files,
    })

    const eslintConfig = deepmerge.all([
      stealthyRequire(require.cache, () => require('.')),
      config.eslintConfig,
    ])

    const eslint = new ESLint({
      extensions: ['.js', '.json', '.vue'],
      overrideConfig: eslintConfig,
      useEslintrc: false,
    })

    const lintedMessages =
      eslint.lintText(config.code, { filePath: config.filename })
      |> await
      |> map('messages')
      |> flatten
      |> map(pick(['message', 'ruleId']))
    expect(lintedMessages).toEqual(config.messages)
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
          extends: packageName`@dword-design/babel-config`,
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
          extends: packageName`@dword-design/babel-config`,
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
  'arrow function with unneeded parens': {
    code: endent`
      export default (foo) => foo

    `,
    messages: [
      { message: 'Replace `(foo)` with `foo`', ruleId: 'prettier/prettier' },
    ],
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
        ruleId: 'simple-import-sort/imports',
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
        ruleId: 'simple-import-sort/imports',
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
  'blank lines: variables and expressions': {
    code: endent`
      import * as THREE from 'three'
      import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
      import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
      
      import ActionManager from './three-utils/action-manager'
      import PlayerMovement from './three-utils/player-movement'
      
      export default async () => {
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xcce0ff)
        scene.fog = new THREE.Fog(0xcce0ff, 100, 500)
      
        const textureLoader = new THREE.TextureLoader()
      
        const gltfLoader = new GLTFLoader()
      
        const renderer = new THREE.WebGLRenderer()
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.shadowMap.enabled = true
      
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        )
        camera.position.y = 2
        camera.position.z = 5
      
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.maxDistance = 15
        controls.maxPolarAngle = 0.4 * Math.PI
        controls.minDistance = 15
        controls.minPolarAngle = 0.25 * Math.PI
      
        const playerMovement = new PlayerMovement(camera)
      
        const light = new THREE.DirectionalLight(0xffffff, 1)
        light.position.set(0, 20, 20)
        light.castShadow = true
        light.shadow.mapSize.width = 2048
        light.shadow.mapSize.height = 2048
        light.shadow.camera = new THREE.OrthographicCamera(
          -500,
          500,
          500,
          -500,
          0.5,
          1000
        )
        scene.add(light)
      
        const groundTexture = textureLoader.load('grasslight-big.jpg')
        groundTexture.wrapS = THREE.RepeatWrapping
        groundTexture.wrapT = THREE.RepeatWrapping
        groundTexture.repeat.set(50, 50)
        groundTexture.anisotropy = 16
        groundTexture.encoding = THREE.sRGBEncoding
      
        const groundMaterial = new THREE.MeshLambertMaterial({ map: groundTexture })
      
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(1000, 1000),
          groundMaterial
        )
        ground.rotation.x = -Math.PI / 2
        ground.receiveShadow = true
        scene.add(ground)
      
        const gltf = await new Promise((resolve, reject) =>
          gltfLoader.load('RobotExpressive.glb', resolve, undefined, reject)
        )
      
        const player = gltf.scene
        player.rotation.y = Math.PI
        player.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true
          }
        })
        scene.add(player)
      
        const actionManager = new ActionManager(gltf)
        actionManager.setAction('Idle')
      
        const keyStates = {}
        document.addEventListener('keydown', event => {
          if (event.code === 'Space' && !keyStates[event.code]) {
            actionManager.triggerOneTimeAction('Jump')
          }
          keyStates[event.code] = true
        })
        document.addEventListener('keyup', event => (keyStates[event.code] = false))
        controls.target = player.position
        playerMovement.target = player
        window.addEventListener('resize', () => {
          camera.aspect = window.innerWidth / window.innerHeight
          camera.updateProjectionMatrix()
          renderer.setSize(window.innerWidth, window.innerHeight)
        })
      
        const clock = new THREE.Clock()
      
        const animate = () => {
          requestAnimationFrame(animate)
      
          const delta = clock.getDelta()
          if (actionManager.activeAction.getClip().name !== 'Jump') {
            actionManager.setAction(
              keyStates.KeyW || keyStates.KeyS || keyStates.KeyA || keyStates.KeyD
                ? 'Running'
                : 'Idle'
            )
          }
          actionManager.update(delta)
          controls.update()
          playerMovement.update(delta)
          renderer.render(scene, camera)
        }
        animate()
      
        return renderer
      }

    `,
    files: {
      'node_modules/three': {
        'examples/jsm': {
          'controls/OrbitControls.js': '',
          'loaders/GLTFLoader.js': '',
        },
        'index.js': '',
      },
      'package.json':
        {
          dependencies: {
            three: '^1.0.0',
          },
        } |> JSON.stringify,
      'three-utils': {
        'action-manager.js': '',
        'player-movement.js': '',
      },
    },
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
        ruleId: 'simple-import-sort/imports',
      },
    ],
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
        ruleId: 'simple-import-sort/imports',
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
      sortKeys(
        {
          name: 'foo',
          version: '1.0.0',
        },
        { compare: (a, b) => -a.localeCompare(b) }
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
        2
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
        2
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
