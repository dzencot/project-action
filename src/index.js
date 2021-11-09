// @ts-check

// https://github.com/actions/javascript-action
// https://github.com/actions/toolkit/blob/master/docs/action-debugging.md

const fs = require('fs');
const path = require('path');
const artifact = require('@actions/artifact');
const core = require('@actions/core');
const io = require('@actions/io');
const exec = require('@actions/exec');
const { HttpClient } = require('@actions/http-client');
const colors = require('ansi-colors');
const yaml = require('js-yaml');

const buildRoutes = require('./routes.js');
const { checkPackageName } = require('./packageChecker.js');

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
  core.info(colors.bgYellow.black('Download snapshots from Artifacts.'));
};

const uploadTestData = async (options) => {
  const { projectSourcePath, verbose } = options;

  const specPath = path.join(projectSourcePath, '__data__', 'spec.yml');

  // NOTE: The project image is not downloaded until the last step is reached.
  if (!fs.existsSync(specPath)) {
    return;
  }

  const specContent = fs.readFileSync(specPath).toString();
  const specData = yaml.load(specContent);
  const { artifacts } = specData.project;

  if (!artifacts) {
    return;
  }

  const existPaths = artifacts.filter((artifactPath) => (
    fs.existsSync(path.join(projectSourcePath, artifactPath))
  ));

  if (existPaths.length === 0) {
    return;
  }

  const archiveName = 'test-data.zip';
  const cmdOptions = { silent: !verbose, cwd: projectSourcePath };
  const command = `zip -r ${archiveName} ${existPaths.join(' ')}`;
  await exec.exec(command, null, cmdOptions);

  const artifactName = 'test-data';
  const artifactClient = artifact.create();
  const archivePath = path.join(projectSourcePath, archiveName);
  await artifactClient.uploadArtifact(artifactName, [archivePath], projectSourcePath);
  core.info(colors.bgYellow.black('Download snapshots from Artifacts.'));
};

const prepareProject = async (options) => {
  const {
    codePath,
    projectPath,
    projectMember,
    projectSourcePath,
    mountPath,
    verbose,
  } = options;
  const cmdOptions = { silent: !verbose };

  const projectImageName = 'dzencot/test-project-ci';
  await io.mkdirP(projectSourcePath);
  const pullCmd = `docker pull ${projectImageName}"`;
  await exec.exec(pullCmd, null, cmdOptions);
  // NOTE: the code directory remove from the container,
  // since it was created under the rights of root.
  // await io.rmRF(codePath); - deletes a directory with the rights of the current user
  const copyCmd = `docker run -v ${mountPath}:/mnt ${projectImageName} bash -c "cp -r /project/. /mnt/source && rm -rf /mnt/source/code"`;
  await exec.exec(copyCmd, null, cmdOptions);
  await io.mkdirP(codePath);
  await io.cp(`${projectPath}/.`, codePath, { recursive: true });
  await exec.exec('docker', ['build', '--cache-from', projectImageName, '.'], { ...cmdOptions, cwd: projectSourcePath });
};

const check = async ({ projectSourcePath, codePath, projectMember }) => {
  const sourceLang = projectMember.project.language;
  checkPackageName(codePath, sourceLang);
  const options = { cwd: projectSourcePath };
  // NOTE: Installing dependencies is part of testing the project.
  await exec.exec('docker-compose', ['run', 'app', 'make', 'setup'], options);
  await exec.exec('docker-compose', ['-f', 'docker-compose.yml', 'up', '--abort-on-container-exit'], options);

  const checkState = {
    state: 'success',
  };
  core.exportVariable('checkState', JSON.stringify(checkState));
};

const runTests = async (params) => {
  const { mountPath, projectMemberId } = params;
  const routes = buildRoutes(process.env.ACTION_API_HOST);
  const projectSourcePath = path.join(mountPath, 'source');
  const codePath = path.join(projectSourcePath, 'code');
  const initialCheckState = {
    state: 'fail',
  };
  core.exportVariable('checkState', JSON.stringify(initialCheckState));

  const link = routes.projectMemberPath(projectMemberId);
  const http = new HttpClient();
  const response = await http.get(link);
  const data = await response.readBody();
  core.debug(data);
  const projectMember = JSON.parse(data);

  if (!projectMember.tests_on) {
    core.warning('Tests will run during review step');
    return;
  }

  const options = {
    ...params,
    codePath,
    projectMember,
    projectSourcePath,
  };

  await core.group('Preparing', () => prepareProject(options));
  await check(options);
};

const finishCheck = async (projectMemberId) => {
  const { checkState } = process.env;

  const routes = buildRoutes(process.env.ACTION_API_HOST);
  const http = new HttpClient();

  const link = routes.projectMemberCheckPath(projectMemberId);
  await http.postJson(link, { check: checkState });
};

// NOTE: Post actions should be performed regardless of the test completion result.
const runPostActions = async (params) => {
  const { mountPath, projectMemberId, verbose } = params;
  const projectSourcePath = path.join(mountPath, 'source');

  const diffpath = path.join(
    mountPath,
    'source',
    'tmp',
    'artifacts',
  );

  const options = {
    projectSourcePath,
    verbose,
  };

  await core.group('Finish check', () => finishCheck(projectMemberId));
  await core.group('Upload artifacts', () => uploadArtifacts(diffpath));
  await core.group('Upload test data', () => uploadTestData(options));
};

module.exports = {
  runTests,
  runPostActions,
};
