const { test } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
const os = require('os');
const nock = require('nock');
const { URL } = require('url');
const { execSync } = require('child_process');
const run = require('../src/index.js');
const buildRoutes = require('../src/routes.js');

const fsp = fs.promises;
const projectFixture = path.join(__dirname, '../__fixtures__/project_source');

nock.disableNetConnect();

test('run', async () => {
  const routes = buildRoutes();
  const projectMemberId = 1;
  const url = new URL(routes.projectMemberPath(projectMemberId));
  const result = {
    tests_on: true,
    project: {
      image_name: 'hexlet-project-source-ci',
    },
  };
  nock(url.origin)
    .get(url.pathname)
    .query(true)
    .reply(200, result);

  const tmp = os.tmpdir();
  const mountPath = await fsp.mkdtemp(path.join(tmp, 'hexlet-project-'));
  const projectPath = await fsp.mkdtemp(path.join(tmp, 'hexlet-project-'));
  execSync(`cp -r ${projectFixture}/. ${projectPath}`);

  await run({
    mountPath, projectPath, verbose: true, projectMemberId,
  });
}, 50000);
