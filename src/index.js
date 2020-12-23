// https://github.com/actions/javascript-action

const fs = require('fs');
const path = require('path');
const artifact = require('@actions/artifact');
const core = require('@actions/core');
const io = require('@actions/io');
const exec = require('@actions/exec');
const { HttpClient } = require('@actions/http-client');
// const { execSync } = require('child_process');
// const _ = require('lodash');

const routes = require('./routes.js');

const uploadArtifacts = async ({ diffpath }) => {
  if (!fs.existsSync(diffpath)) {
    return;
  }

  const diffstats = fs.statSync(diffpath);
  if (!diffstats.isDirectory()) {
    return;
  }

  const filepaths = fs
    .readdirSync(diffpath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);

  // if (filepaths.length === 0) {
  //   return;
  // }

  const artifactClient = artifact.create();
  const artifactName = 'test-results';
  await artifactClient.uploadArtifact(artifactName, filepaths, diffpath);
  // core.warning('Download snapshots from Artifacts.');
  // core.warning('The link is above the output window.');
};

const prepareProject = async (options) => {
  const {
    verbose,
    codePath,
    projectPath,
    projectMember,
    projectSourcePath,
    mountPoint
  } = options
  const projectImageName = `hexletprojects/${projectMember.project.image_name}:release`;
  await io.mkdirP(projectSourcePath);
  await exec.exec(
    `docker`,
    ['run', '-v', `${mountPoint}:/mnt`, projectImageName, 'bash -c "cp -r /project/. /mnt/source"'],
    { silent: !verbose },
  );
  await io.rmRF(codePath);
  await io.mkdirP(codePath);
  await io.cp(`${projectPath}/.`, codePath, { recursive: !verbose });
  // await exec.exec(`docker tag ${projectImageName} source_development:latest`, [], { silent: !verbose });
  await exec.exec('docker-compose', ['run', 'app', 'make', 'setup'], { cwd: projectSourcePath, silent: !verbose });
};

const check = () =>
  exec.exec('docker-compose', ['-f', 'docker-compose.yml', 'up'], { cwd: projectSourcePath });

const run = async ({ mountPoint, verbose, projectMemberId }) => {
  const projectSourcePath = path.join(mountPoint, 'source');
  const codePath = path.join(projectSourcePath, 'code');
  const projectPath = process.cwd();

  const diffpath = path.join(
    mountPoint,
    'source',
    '__tests__',
    '__image_snapshots__',
    '__diff_output__',
  );


  const link = routes.projectMemberPath(projectMemberId);
  const http = new HttpClient();
  const response = await http.get(link);
  const data = await response.readBody();
  const projectMember = JSON.parse(data);
  // console.log(projectMember);

  if (!projectMember.tests_on) {
    core.info('Tests will run during review step');
    return;
  }

  const options = {
    verbose,
    codePath,
    projectPath,
    diffpath,
    projectMember,
    projectSourcePath,
    mountPoint,
  };

  core.info('prepearing');
  await prepareProject(options);
  core.info('checking');
  await check(options);
  core.info('finishing');
  await uploadArtifacts(options);
};

module.exports = run;
