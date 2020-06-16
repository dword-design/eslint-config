export default {
  // Doesn't support promises
  child_process: 'execa',
  // Execa offers more syntactic sugar
  'child-process-promise': 'execa',
  // Doesn't support promises
  fs: 'fs-extra',
  'resolve-dep': 'matchdep',
  puppeteer: '@dword-design/puppeteer',
  // Doesn't support promises
  'tree-kill': 'tree-kill-promise',
  // Doesn't support promises
  glob: 'globby',
  // Doesn't support pattern arrays
  'glob-promise': 'globby',
  // Only works for Node.js >= 12
  matched: 'globby',
}
