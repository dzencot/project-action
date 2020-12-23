const { test } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
const os = require('os');
const nock = require('nock');
const { URL } = require('url');
const run = require('../src/index.js');
const routes = require('../src/routes.js');

const fsp = fs.promises;

nock.disableNetConnect();

test('run', async () => {
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
    .reply(200, result);

  const tmp = os.tmpdir();
  const mountPath = await fsp.mkdtemp(path.join(tmp, 'hexlet-project-'));
  const projectPath = await fsp.mkdtemp(path.join(tmp, 'hexlet-project-'));
  await run({
    mountPath, projectPath, verbose: true, projectMemberId,
  });
}, 10000);
