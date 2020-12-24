// TODO https://hexlet.io/api/user-project-github-workflow/projects/:slug/
const path = require('path');

const apiUrl = '/api/user_project_github_workflow/';

const buildRoutes = (host = 'https://hexlet.io') => ({
  projectMemberPath: (id) => path.join(host, apiUrl, `project_members/${id}?format=json`),
});

module.exports = buildRoutes;
