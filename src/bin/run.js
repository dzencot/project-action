// @ts-check

const path = require('path');
const core = require('@actions/core');
const run = require('../index.js');

process.on('unhandledRejection', (up) => { throw up; });

const mountPath = path.join('/', 'var', 'tmp');
const verbose = core.getInput('verbose', { required: true }) === 'true';
const projectMemberId = process.env.HEXLET_ID;
const projectPath = path.resolve(process.cwd(), process.env.ACTION_PROJECT_PATH || '');

const options = {
  projectPath, mountPath, verbose, projectMemberId,
};

core.debug(JSON.stringify(options));

run(options);
