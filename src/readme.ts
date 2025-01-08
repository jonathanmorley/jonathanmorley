import fs from 'node:fs';
import path from 'node:path';
import { Octokit } from '@octokit/rest';
import { type SimpleCheck, getChecks, checksToMarkdown } from './checks.ts';
import { type SimpleWorkflow, getWorkflows, workflowsToMarkdown } from './workflows.ts';
import { type SimpleRepository } from './repositories.ts';

async function updateReadme(checks: SimpleCheck[], workflows: SimpleWorkflow[]): Promise<void> {
  const readmePath = path.join(import.meta.dirname, '..', 'README.md');

  let readmeContent = await fs.promises.readFile(readmePath, 'utf-8');
  readmeContent = readmeContent.replace(
    /<!-- checks-start -->[\s\S]*<!-- checks-end -->/m,
    `<!-- checks-start -->\n${checksToMarkdown(checks)}\n<!-- checks-end -->`
  );
  readmeContent = readmeContent.replace(
    /<!-- workflows-start -->[\s\S]*<!-- workflows-end -->/m,
    `<!-- workflows-start -->\n${workflowsToMarkdown(workflows)}\n<!-- workflows-end -->`
  );

  await fs.promises.writeFile(readmePath, readmeContent, 'utf-8');
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const repos = await octokit.paginate(octokit.repos.listForUser, { username: 'jonathanmorley' });
const results = await Promise.all(repos.map(async repo => {
  if (!repo.default_branch) throw new Error(`Default branch not found for ${repo.full_name}`);

  return {
    checks: await getChecks(octokit, repo as SimpleRepository),
    workflows: await getWorkflows(octokit, repo as SimpleRepository)
  }
}));

const checks = results.flatMap(result => result.checks);
const workflows = results.flatMap(result => result.workflows);

await updateReadme(checks, workflows);