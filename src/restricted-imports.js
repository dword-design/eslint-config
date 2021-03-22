export default {
  '@nuxtjs/auth': '@dword-design/nuxt-auth',

  // Not maintained anymore
  chdir: '@dword-design/chdir',

  // Execa offers more syntactic sugar
  'child-process-promise': 'execa',

  // Doesn't support promises
  child_process: 'execa',

  delay: '@dword-design/functions',

  // Doesn't support promises
  fs: 'fs-extra',

  // Doesn't support promises
  glob: 'globby',

  // Doesn't support pattern arrays
  'glob-promise': 'globby',

  // Only works for Node.js >= 12
  matched: 'globby',

  // Supports inline importing CSS files
  'node-sass-tilde-importer': 'node-sass-package-importer',

  proxyquire: '@dword-design/proxyquire',

  puppeteer: '@dword-design/puppeteer',

  'resolve-dep': 'matchdep',

  // Doesn't support recursive sorting
  'sort-object-keys': 'sort-keys',

  // Doesn't support promises
  'tree-kill': 'tree-kill-promise',
}
