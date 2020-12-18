const fs = require('fs');
const path = require('path');
const artifact = require('@actions/artifact');
const core = require('@actions/core');
const io = require('@actions/io');
const exec = require('@actions/exec');
const { execSync } = require('child_process');
const get = require('lodash/get');

const apiUrl = 'https://hexlet.io/api/github_workflow/v1/project/';

const mountPoint = path.join('/', 'var', 'tmp');
const buildPath = path.join(mountPoint, 'source');
const codePath = path.join(buildPath, 'code');
const projectPath = process.cwd();
const githubRepository = process.env.GITHUB_REPOSITORY;

const diffpath = path.join(
  mountPoint,
  'source',
  '__tests__',
  '__image_snapshots__',
  '__diff_output__',
);

const uploadArtifacts = async () => {
  if (!fs.existsSync(diffpath)) {
    return;
  }

  const diffstats = fs.statSync(diffpath);
  if (!diffstats.isDirectory()) {
    return;
  }

  const filepaths = fs
    .readdirSync(diffpath)
    .filter((filename) => {
      const filepath = path.join(diffpath, filename);
      const stats = fs.statSync(filepath);
      return stats.isFile();
    })
    .map((filename) => path.join(diffpath, filename));

  if (filepaths.length === 0) {
    return;
  }

  const artifactClient = artifact.create();
  const artifactName = 'test-results';
  await artifactClient.uploadArtifact(artifactName, filepaths, diffpath);
  core.warning('Download snapshots from Artifacts.');
  core.warning('The link is above the output window.');
};

const isLastStepProject = () => {
  const urlCheck = new URL('ready_to_check/', apiUrl);
  urlCheck.searchParams.set('github_repository', githubRepository);
  const responseCheck = execSync(`curl -s ${urlCheck.toString()}`);
  return JSON.parse(responseCheck.toString());
};

const getImageName = () => {
  const urlProject = new URL(apiUrl);
  urlProject.searchParams.set('github_repository', githubRepository);
  const responseProject = execSync(`curl -s ${urlProject.toString()}`);
  const data = JSON.parse(responseProject.toString());
  return get(data, 'project.image_name');
};

const runPreparationForTesting = async (imageName) => {
  await io.mkdirP(buildPath);
  // Copy original project files
  await exec.exec(
    `docker run -v ${mountPoint}:/mnt hexletprojects/${imageName}:release bash -c "cp -r /project/. /mnt/source && rm -rf /mnt/source/code"`,
    [],
    { silent: true },
  );
  await io.mkdirP(codePath);
  await io.cp(`${projectPath}/.`, codePath, { recursive: true });
  await exec.exec(`docker tag hexletprojects/${imageName}:release source_development:latest`, [], { silent: true });
  await exec.exec('docker-compose', ['build'], { cwd: buildPath, silent: true });
};

const runSetupTestLint = async () => {
  await exec.exec('docker-compose', ['run', 'development', 'make', 'setup', 'test', 'lint'], { cwd: buildPath });
};

const runAction = async () => {
  core.info('Checking the possibility of starting testing...');
  try {
    if (!isLastStepProject()) {
      core.error('Hexlet check will run after finish the last project step.');
      process.exit(0);
    }
  } catch (e) {
    core.error('Project or user not found!');
    process.exit(1);
  }

  let imageName;
  try {
    imageName = getImageName();
    if (!imageName) {
      core.error('Image name is not defined!');
      process.exit(1);
    }
  } catch (e) {
    core.error('An error occurred getting the image name!');
    process.exit(1);
  }
  core.info('\u001b[38;5;6mChecking completed.');

  core.info('Preparing to start testing. It can take some time. Please wait...');
  await runPreparationForTesting(imageName);
  core.info('\u001b[38;5;6mPreparing completed.');

  try {
    await runSetupTestLint();
  } catch (e) {
    await uploadArtifacts();
    core.error('Testing failed. See the output.');
    process.exit(1);
  }
};

runAction();
