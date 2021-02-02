// @ts-check

const fs = require('fs');
const path = require('path');
const ini = require('ini');
const yaml = require('js-yaml');
const _ = require('lodash');

const parsers = {
  json: JSON.parse,
  toml: ini.parse,
  yml: yaml.load,
};

const getFullPath = (dirpath, filename) => path.resolve(dirpath, filename);
const getFormat = (filepath) => path.extname(filepath).slice(1);
const parse = (content, format) => parsers[format](content);
const getData = (filepath) => parse(fs.readFileSync(filepath, 'utf-8'), getFormat(filepath));

const getProjectLanguage = (projectSourcePath) => {
  const spec = getData(getFullPath(projectSourcePath, 'spec.yml'));
  return _.get(spec, 'project.language');
};

const mapping = {
  python: {
    expectedPackageName: 'hexlet-code',
    getPackageName: (codePath) => (
      getData(getFullPath(codePath, 'pyproject.toml')).tool.poetry.name
    ),
  },
  php: {
    expectedPackageName: 'hexlet/code',
    getPackageName: (codePath) => (
      getData(getFullPath(codePath, 'composer.json')).name
    ),
  },
  javascript: {
    expectedPackageName: '@hexlet/code',
    getPackageName: (codePath) => (
      getData(getFullPath(codePath, 'package.json')).name
    ),
  },
};

const checkPackageName = (projectSourcePath, codePath) => {
  const sourceLang = getProjectLanguage(projectSourcePath);
  const props = mapping[sourceLang];

  // NOTE: If the properties for checking the current project
  // is not found, skip the check.
  if (!props) {
    return;
  }

  const { expectedPackageName, getPackageName } = props;
  const packageName = getPackageName(codePath);

  if (packageName !== expectedPackageName) {
    throw new Error(`Package name should be ${expectedPackageName} instead of ${packageName}`);
  }
};

module.exports = {
  checkPackageName,
};
