// @ts-check

const path = require('path');
const core = require('@actions/core');
const run = require('../index.js');

process.on('unhandledRejection', (up) => { throw up; });

const mountPath = path.join('/', 'var', 'tmp');
const verbose = core.getInput('verbose', { required: true }) === 'true';
const projectMemberId = core.getInput('project-member-id', { required: true });
const projectPath = path.resolve(process.cwd(), process.env.ACTION_PROJECT_PATH || '');

const options = {
  projectPath, mountPath, verbose, projectMemberId,
};

core.info(JSON.stringify(options));

run(options);
