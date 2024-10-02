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

    // Get the pull request context
    const { context } = github;
    const pr = context.payload.pull_request;

    if (!pr) {
      core.setFailed('This action must be run in a pull request context.');
      return;
    }

    // Get the pull request body (description)
    const prBody = pr.body;

    if (!prBody) {
      core.setFailed('Pull request body is undefined.');
      return;
    }

    // Check for incomplete tasks (task checkboxes)
    const incompleteTasks = (prBody.match(/- \[ \]/g) || []).length;
    const totalTasks = (prBody.match(/- \[[ xX]\]/g) || []).length;

    if (totalTasks > 0 && incompleteTasks > 0) {
      core.setFailed(`There are ${incompleteTasks} incomplete tasks in the PR description.`);

      // Create or update the check run with a "pending" status (in progress)
      await octokit.rest.checks.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        name: 'Task List Checker',
        head_sha: pr.head.sha,
        status: 'completed',
        conclusion: 'action_required', // Block the merge
        output: {
          title: 'Incomplete tasks',
          summary: `There are ${incompleteTasks} incomplete tasks in the PR description. Please complete them before merging.`
        }
      });
    } else if (totalTasks > 0 && incompleteTasks === 0) {
      core.info('All tasks are complete.');

      // Mark the check as successful if all tasks are completed
      await octokit.rest.checks.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        name: 'Task List Checker',
        head_sha: pr.head.sha,
        status: 'completed',
        conclusion: 'success', // Allow the merge
        output: {
          title: 'All tasks complete',
          summary: 'All tasks in the PR description have been completed.'
        }
      });
    } else {
      // If there are no tasks in the PR description
      core.info('No tasks found in the PR description.');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
