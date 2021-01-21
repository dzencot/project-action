// @ts-check

const fs = require('fs');
const path = require('path');
const ini = require('ini');

const parsers = {
  json: JSON.parse,
  toml: ini.parse,
};

const getFullPath = (codePath, filename) => path.resolve(codePath, filename);
const getFormat = (filepath) => path.extname(filepath).slice(1);
const parse = (content, format) => parsers[format](content);
const getData = (filepath) => parse(fs.readFileSync(filepath, 'utf-8'), getFormat(filepath));

const getSourceLang = (imageName) => {
  const indexMarker = imageName.indexOf('_');
  return imageName.substring(0, indexMarker);
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
  js: {
    expectedPackageName: '@hexlet/code',
    getPackageName: (codePath) => (
      getData(getFullPath(codePath, 'package.json')).name
    ),
  },
};

const checkPackageName = (imageName, codePath) => {
  const sourceLang = getSourceLang(imageName);
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
