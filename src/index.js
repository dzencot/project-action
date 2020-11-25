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

const app = async () => {
  core.info('Checking the possibility of starting testing...');
  // Get readiness for checking repo
  const urlCheck = new URL('ready_to_check/', apiUrl);
  urlCheck.searchParams.set('github_repository', githubRepository);
  const responseCheck = execSync(`curl -s ${urlCheck.toString()}`);
  try {
    const result = JSON.parse(responseCheck.toString());
    if (!result) {
      core.error('Hexlet check will run after finish the last project step.');
      process.exit(1);
    }
  } catch (e) {
    core.error('Project or user not found!');
    process.exit(1);
  }

  // Get project base image name
  let imageName;
  const urlProject = new URL(apiUrl);
  urlProject.searchParams.set('github_repository', githubRepository);
  const responseProject = execSync(`curl -s ${urlProject.toString()}`);
  try {
    const data = JSON.parse(responseProject.toString());
    imageName = get(data, 'project.image_name');
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
  // Create build directory
  await io.mkdirP(buildPath);

  // Copy original project files
  await exec.exec(
    `docker run -v ${mountPoint}:/mnt hexletprojects/${imageName}:release bash -c "cp -r /project/. /mnt/source && rm -rf /mnt/source/code"`,
    [],
    { silent: true },
  );

  // Create user code directory
  await io.mkdirP(codePath);

  // Copy user project to build directory
  await io.cp(`${projectPath}/.`, codePath, { recursive: true });

  // Create a tags
  await exec.exec(`docker tag hexletprojects/${imageName}:release source_development:latest`, [], { silent: true });

  // Build images
  await exec.exec('docker-compose', ['build'], { cwd: buildPath, silent: true });
  core.info('\u001b[38;5;6mPreparing completed.');

  try {
    // Run setup, tests, lint
    await exec.exec('docker-compose', ['run', 'development', 'make', 'setup', 'test', 'lint'], { cwd: buildPath });
  } catch (e) {
    // Upload artifacts
    await uploadArtifacts();
    core.error('Testing failed. See the output.');
    process.exit(1);
  }
};

app();
