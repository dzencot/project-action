// @ts-check

const fs = require('fs');
const path = require('path');
const ini = require('ini');

const parsers = {
  json: JSON.parse,
  toml: ini.parse,
};

const getFormat = (filepath) => path.extname(filepath).slice(1);
const parse = (content, format) => parsers[format](content);
const getData = (filepath) => parse(fs.readFileSync(filepath, 'utf-8'), getFormat(filepath));

const mapLangToAction = {
  python: () => getData('pyproject.toml').tool.poetry.name,
  php: () => getData('composer.json').name,
  js: () => getData('package.json').name,
};

const packageNames = {
  python: 'hexlet_code',
  php: 'hexlet/code',
  js: '@hexlet/code',
};

const checkPackageName = (imageName) => {
  const indexMarker = imageName.indexOf('_');
  const sourceLang = imageName.substring(0, indexMarker);
  const getPackageName = mapLangToAction[sourceLang];

  // NOTE: If the function for checking the current project
  // is not found, skip the check.
  if (!getPackageName) {
    return;
  }

  const packageName = getPackageName();
  const expectedPackageName = packageNames[sourceLang];

  if (packageName !== expectedPackageName) {
    throw new Error(`Package name should be ${expectedPackageName}`);
  }
};

module.exports = {
  checkPackageName,
};
