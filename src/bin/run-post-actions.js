// @ts-check

const core = require('@actions/core');
const { runPostActions } = require('../index.js');

process.on('unhandledRejection', (up) => { throw up; });

const mountPath = core.getInput('mount-path', { required: true });
const projectMemberId = core.getInput('hexlet-id', { required: true });

const options = {
  mountPath, projectMemberId,
};

runPostActions(options);
