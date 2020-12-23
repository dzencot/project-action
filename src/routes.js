// TODO https://hexlet.io/api/user-project-github-workflow/projects/:slug/
const path = require('path');

const apiUrl = 'https://hexlet.io/api/user_project_github_workflow/';

const routes = {
  projectMemberPath: (id) => path.join(apiUrl, `project_members/${id}`),
};

module.exports = routes;
