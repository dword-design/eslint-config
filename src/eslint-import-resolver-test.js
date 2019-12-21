import resolverTest from '@dword-design/resolver-test'
import eslintImportResolverNode from 'eslint-import-resolver-node'

export const interfaceVersion = 2
export const resolve = (request, source) => {
  const path = resolverTest(request, source)
  return path !== undefined
    ? { found: true, path }
    : eslintImportResolverNode.resolve(request, source)
}
