// @ts-check

const path = require('path');
const core = require('@actions/core');
const { runTests } = require('../index.js');

process.on('unhandledRejection', (up) => { throw up; });

core.exportVariable('COMPOSE_DOCKER_CLI_BUILD', 1);
core.exportVariable('DOCKER_BUILDKIT', 1);

// const mountPath = core.getInput('mount-path', { required: true });
// const verbose = core.getInput('verbose', { required: true }) === 'true';
// const projectMemberId = core.getInput('hexlet-id', { required: true });
const projectPath = path.resolve(process.cwd(), process.env.ACTION_PROJECT_PATH || '');
const mountPath = '/var/tmp';
const verbose = true;
const projectMemberId = 12438;

const options = {
  projectPath, mountPath, verbose, projectMemberId,
};

// core.debug(JSON.stringify(options));

runTests(options);
