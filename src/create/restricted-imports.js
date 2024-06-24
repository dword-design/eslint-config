export default [
  {
    alternative: 'parse-packagejson-name',
    message: 'Does not work in the browser due to fs dependency in ow.',
    name: 'parse-pkg-name',
  },
  {
    alternative: '@dword-design/nuxt-auth',
    message: 'Does not auto-rewrite redirects.',
    name: '@nuxtjs/auth',
  },
  {
    alternative: '@dword-design/chdir',
    message: 'It is not maintained anymore.',
    name: 'chdir',
  },
  {
    alternative: 'execa',
    message: "'execa' provides more features and syntactic sugar.",
    name: 'child-process-promise',
  },
  {
    alternative: 'execa',
    message: 'It does not support promises.',
    name: 'child_process',
  },
  {
    alternative: '@dword-design/functions',
    message: "delay is included in '@dword-design/functions'.",
    name: 'delay',
  },
  {
    alternative: 'fs-extra',
    message: 'Does not support promises.',
    name: 'fs',
  },
  {
    alternative: 'globby',
    message: 'Does not support promises.',
    name: 'glob',
  },
  {
    alternative: 'globby',
    message: 'Does not support pattern arrays.',
    name: 'glob-promise',
  },
  {
    alternative: 'globby',
    message: 'Only works for Node.js >= 12.',
    name: 'matched',
  },
  {
    alternative: 'node-sass-package-importer',
    message: 'Does not support inline importing CSS files.',
    name: 'node-sass-tilde-importer',
  },
  {
    alternative: '@dword-design/proxyquire',
    message: 'Does not set some important default values.',
    name: 'proxyquire',
  },
  {
    alternative: 'stealthy-require-no-leak',
    message: 'Has a memory leak when requiring the same module multiple times.',
    name: 'stealthy-require',
  },
  {
    alternative: '@dword-design/puppeteer',
    message: 'Does not set no-sandbox.',
    name: 'puppeteer',
  },
  {
    alternative: 'matchdep',
    name: 'resolve-dep',
  },
  {
    alternative: 'sort-keys',
    message: 'Does not support recursive sorting.',
    name: 'sort-object-keys',
  },
  {
    alternative: 'tree-kill-promise',
    message: 'Does not support promises.',
    name: 'tree-kill',
  },
  {
    importNames: ['zipObject'],
    message: 'Use map and fromPairs instead',
    name: '@dword-design/functions',
  },
];
