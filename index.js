const github = require('@actions/github');
const core = require('@actions/core');

async function run() {
  try {
    // Get the GitHub token from the environment variable
    const token = process.env.GITHUB_TOKEN;  // Use the environment variable for the token
    if (!token) {
      throw new Error('GitHub token is missing');
    }

    // Initialize the Octokit client with the token
    const octokit = github.getOctokit(token);

    // Get the pull request context
    const { context } = github;
    const pr = context.payload.pull_request;

    if (!pr) {
      core.setFailed('This action must be run in a pull request context.');
      return;
    }

    // Get the pull request body (description)
    const prBody = pr.body;

    // Check if the pull request body is defined
    if (!prBody) {
      core.setFailed('Pull request body is undefined.');
      return;
    }

    // Check for incomplete tasks (task checkboxes)
    const incompleteTasks = (prBody.match(/- \[ \]/g) || []).length;

    if (incompleteTasks > 0) {
      core.setFailed(`There are ${incompleteTasks} incomplete tasks in the PR description.`);
    } else {
      core.info('All tasks are complete.');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
