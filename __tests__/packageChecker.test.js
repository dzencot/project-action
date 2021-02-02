const { describe, test, expect, it } = require('@jest/globals');
const path = require('path');
const fs = require('fs');

const { checkPackageName } = require('../src/packageChecker.js');

const getFixturePath = (...paths) => (
  path.join(__dirname, '..', '__fixtures__', ...paths)
);

const getCodePath = (dirname) => getFixturePath('package_files', dirname);

const getProjectSourcePaths = (dirname) => {
  const projectsPath = getFixturePath('projects_with_spec', dirname);
  return fs
    .readdirSync(projectsPath)
    .map((dirname) => path.join(projectsPath, dirname));
};

describe('test projects with correct package name', () => {
  const codePath = getCodePath('correct');
  const projectSourcePaths = getProjectSourcePaths('verifiable');

  test.each(projectSourcePaths)('%s', (projectSourcePath) => {
    expect(() => checkPackageName(projectSourcePath, codePath))
      .not.toThrowError();
  });
});

describe('test projects with wrong package name', () => {
  const codePath = getCodePath('wrong');
  const projectSourcePaths = getProjectSourcePaths('verifiable');

  test.each(projectSourcePaths)('%s', (projectSourcePath) => {
    expect(() => checkPackageName(projectSourcePath, codePath))
      .toThrowError(/^Package name should be .+ instead of wrong-package-name$/);
  });
});

describe('test not verifiable projects', () => {
  const codePath = getCodePath('correct');
  const projectSourcePaths = getProjectSourcePaths('not_verifiable');

  test.each(projectSourcePaths)('%s', (projectSourcePath) => {
    expect(() => checkPackageName(projectSourcePath, codePath))
      .not.toThrowError();
  });
});

describe('test incorrect projects without spec', () => {
  const codePath = getCodePath('correct');
  const projectSourcePaths = getProjectSourcePaths('incorrect');

  test.each(projectSourcePaths)('%s', (projectSourcePath) => {
    expect(() => checkPackageName(projectSourcePath, codePath))
      .toThrowError();
  });
});
