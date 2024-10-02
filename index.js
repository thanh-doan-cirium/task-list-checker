const github = require('@actions/github');
const core = require('@actions/core');

async function run() {
  try {
    const token = core.getInput('github-token');
    const octokit = github.getOctokit(token);

    const { context } = github;
    const prBody = context.payload.pull_request.body;
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