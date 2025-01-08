import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import json2md from 'json2md';
import { type Unpacked } from './types.ts';
import { type SimpleRepository } from './repositories.ts';

export type SimpleWorkflow = Pick<Unpacked<RestEndpointMethodTypes['actions']['listRepoWorkflows']['response']['data']['workflows']>, 'name' | 'state' | 'badge_url' | 'html_url'> & { repo: string, repo_url: string };

export async function getWorkflows(octokit: Octokit, repository: SimpleRepository): Promise<SimpleWorkflow[]> {
  const workflows = await octokit.paginate(octokit.actions.listRepoWorkflows, {
    owner: repository.owner.login,
    repo: repository.name
  });

  return workflows.map(({ name, state, badge_url, html_url }) => ({
    repo: repository.full_name,
    repo_url: repository.html_url,
    name,
    state,
    badge_url,
    html_url
  }));
}

export function workflowsToMarkdown(workflows: SimpleWorkflow[]): string {
  return json2md([{
    table: {
      headers: ['Repository', 'Workflow', 'State'],
      rows: workflows.map(({ repo, repo_url, name, state, badge_url, html_url }) => ({
        Repository: `[${repo}](${repo_url})`,
        Workflow: `[![${name}](${badge_url})](${html_url})`,
        State: state === 'active' ? `✅ ${state}` : `❌ ${state}`,
      }))
    }
  }]);
}

