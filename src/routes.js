// TODO https://hexlet.io/api/user-project-github-workflow/projects/:slug/
const path = require('path');

const apiUrl = '/api/user_project_github_workflow/';

const buildRoutes = (host = 'https://hexlet.io') => ({
  projectMemberPath: (id) => {
    const urlPath = path.join(apiUrl, `project_members/${id}.json`);
    const url = new URL(urlPath, host);
    return url.toString();
  },
});

module.exports = buildRoutes;
