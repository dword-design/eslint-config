/**
 * For some reason eslint-import-resolver-typescript won't load TypeScript project references, so we add them manually.
 */

import ts from 'typescript';

export default ({ cwd = '.' }: { cwd?: string } = {}): string[] => {
  const configPath = ts.findConfigFile(cwd, ts.sys.fileExists, 'tsconfig.json');

  if (!configPath) {
    return [];
  }

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);

  if (configFile.error) {
    return [];
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    cwd,
  );

  if (
    parsedConfig.projectReferences &&
    parsedConfig.projectReferences.length > 0
  ) {
    // Only return the references, not the root tsconfig
    // The root tsconfig in a project references setup is often just a container
    return parsedConfig.projectReferences.map(reference => reference.path);
  }

  // No references, return the root tsconfig
  return [configPath];
};
