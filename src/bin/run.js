const path = require('path');
const core = require('@actions/core');
const run = require('../index.js');

const mountPoint = path.join('/', 'var', 'tmp');
const verbose = core.getInput('verbose');
const projectMemberId = core.getInput('project-member-id');
const projectPath = process.cwd();

run({
  projectPath, mountPoint, verbose, projectMemberId,
});
