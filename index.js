const github = require('@actions/github');
const core = require('@actions/core');

async function run() {
  try {
    // Get the GitHub token from the action input
    const token = core.getInput('github-token');
    if (!token) {
      throw new Error('GitHub token is missing');
    }

    // Initialize the Octokit client with the token
    const octokit = github.getOctokit(token);

    // Get the pull request body from the context
    const { context } = github;
    const prBody = context.payload.pull_request.body;

    // Check for incomplete tasks (task checkboxes)
    const incompleteTasks = (prBody.match(/- \[ \]/g) || []).length;

    if (incompleteTasks > 0) {
      core.setFailed(`There are ${incompleteTasks} incomplete tasks in the PR description.`);

      // Create a check run with a "pending" status
      await octokit.checks.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        name: 'Task List Checker',
        head_sha: context.payload.pull_request.head.sha,
        status: 'completed',
        conclusion: 'action_required',
        output: {
          title: 'Incomplete tasks',
          summary: `There are ${incompleteTasks} incomplete tasks in the PR description. Please complete them before merging.`
        }
      });
    } else {
      core.info('All tasks are complete.');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();