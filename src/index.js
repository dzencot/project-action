// @ts-check

// https://github.com/actions/javascript-action

const fs = require('fs');
const path = require('path');
const artifact = require('@actions/artifact');
const core = require('@actions/core');
const io = require('@actions/io');
const exec = require('@actions/exec');
const { HttpClient } = require('@actions/http-client');

// const chalk = require('chalk');
// const { execSync } = require('child_process');
// const _ = require('lodash');

const buildRoutes = require('./routes.js');

const uploadArtifacts = async (diffpath) => {
  if (!fs.existsSync(diffpath)) {
    return;
  }

  const diffstats = fs.statSync(diffpath);
  if (!diffstats.isDirectory()) {
    return;
  }

  // https://github.com/actions/toolkit/tree/main/packages/glob
  const filepaths = fs
    .readdirSync(diffpath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => path.join(diffpath, dirent.name));

  // if (filepaths.length === 0) {
  //   return;
  // }

  const artifactClient = artifact.create();
  const artifactName = 'test-results';
  await artifactClient.uploadArtifact(artifactName, filepaths, diffpath);
  // NOTE: Users need notification that screenshots have been generated. Not error.
  // TODO: This output is not visible from the outside.
  // It is necessary to make the user see this inscription.
  core.info('Download snapshots from Artifacts.');
};

const prepareProject = async (options) => {
  const {
    codePath,
    projectPath,
    projectMember,
    projectSourcePath,
    mountPath,
  } = options;
  const projectImageName = `hexletprojects/${projectMember.project.image_name}:latest`;
  await io.mkdirP(projectSourcePath);
  const pullCmd = `docker pull ${projectImageName}"`;
  await exec.exec(pullCmd);
  // NOTE: the code directory remove from the container,
  // since it was created under the rights of root.
  // await io.rmRF(codePath); - deletes a directory with the rights of the current user
  const copyCmd = `docker run -v ${mountPath}:/mnt ${projectImageName} bash -c "cp -r /project/. /mnt/source && rm -rf /mnt/source/code"`;
  await exec.exec(copyCmd);
  await io.mkdirP(codePath);
  await io.cp(`${projectPath}/.`, codePath, { recursive: true });
  await exec.exec('docker', ['build', '--cache-from', projectImageName, '.'], { cwd: projectSourcePath });
};

const check = async ({ projectSourcePath, verbose }) => {
  const options = { cwd: projectSourcePath, silent: !verbose };
  // NOTE: Installing dependencies is part of testing the project.
  await exec.exec('docker-compose', ['run', 'app', 'make', 'setup'], options);
  const exitCode = await exec.exec('docker-compose', ['-f', 'docker-compose.yml', 'up', '--abort-on-container-exit'], options);

  return exitCode;
};

const runTests = async (params) => {
  const { mountPath, projectMemberId } = params;
  const routes = buildRoutes(process.env.ACTION_API_HOST);
  const projectSourcePath = path.join(mountPath, 'source');
  const codePath = path.join(projectSourcePath, 'code');

  const link = routes.projectMemberPath(projectMemberId);
  const http = new HttpClient();
  const response = await http.get(link);
  const data = await response.readBody();
  core.debug(data);
  const projectMember = JSON.parse(data);

  if (!projectMember.tests_on) {
    core.info('Tests will run during review step');
    return;
  }

  const options = {
    ...params,
    codePath,
    projectMember,
    projectSourcePath,
  };

  await core.group('Preparing', () => prepareProject(options));
  const exitCode = await core.group('Checking', () => check(options));

  const checkData = {
    check: {
      state: exitCode === 0 ? 'success' : 'fail',
    },
  };

  core.exportVariable('checkData', JSON.stringify(checkData));
};

const finishCheck = async (params) => {
  const { projectMemberId } = params;
  const routes = buildRoutes(process.env.ACTION_API_HOST);
  const http = new HttpClient();

  const link = routes.projectMemberCheckPath(projectMemberId);
  const response = await http.post(link, process.env.checkData);
  const data = await response.readBody();
  core.debug(data);
};

// NOTE: Post actions should be performed regardless of the test completion result.
const runPostActions = async (params) => {
  const { mountPath, projectMemberId } = params;

  const diffpath = path.join(
    mountPath,
    'source',
    'tmp',
    'artifacts',
  );

  await core.group('Finish check', () => finishCheck(projectMemberId));
  await core.group('Upload artifacts', () => uploadArtifacts(diffpath));
};

module.exports = {
  runTests,
  runPostActions,
};
