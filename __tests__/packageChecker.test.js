const { describe, test, expect } = require('@jest/globals');
const path = require('path');

const { checkPackageName } = require('../src/packageChecker.js');

const verifiableProjects = [
  'js_l2_differ3_project',
  'php_l3_page_analyzer_project',
  'python_l4_task_manager_project',
];

// NOTE: Some projects are not packages.
// Also, in some languages, verification is not needed,
// since the package name is verified when installing the dependencies.
const notVerifiableProjects = [
  'css_l1_cognitive_biases_project',
  'ruby_l1_brain_games_project',
  'java_l1_brain_games2_project',
  'hexlet-project-source-ci',
  'some-project',
  'someproject',
  'some_project',
];

const getFixturePath = (dirname) => (
  path.join(__dirname, '..', '__fixtures__', 'package_files', dirname)
);

describe('test projects with correct package name', () => {
  const codePath = getFixturePath('correct');

  test.each(verifiableProjects)('%s', (imageName) => {
    expect(() => checkPackageName(imageName, codePath))
      .not.toThrowError();
  });
});

describe('test projects with wrong package name', () => {
  const codePath = getFixturePath('wrong');

  test.each(verifiableProjects)('%s', (imageName) => {
    expect(() => checkPackageName(imageName, codePath))
      .toThrowError(/^Package name should be .+ instead of wrong-package-name$/);
  });
});

describe('test not verifiable projects', () => {
  const codePath = getFixturePath('correct');

  test.each(notVerifiableProjects)('%s', (imageName) => {
    expect(() => checkPackageName(imageName, codePath))
      .not.toThrowError();
  });
});
