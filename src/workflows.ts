import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import json2md from 'json2md';

type Unpacked<T> = T extends (infer U)[] ? U : T;
export type SimpleWorkflow = Pick<Unpacked<RestEndpointMethodTypes['actions']['listRepoWorkflows']['response']['data']['workflows']>, 'name' | 'state' | 'badge_url' | 'html_url'> & { repo: string };

export async function getWorkflows(octokit: Octokit, repository: { owner: { login: string }, name: string, full_name: string, default_branch?: string }): Promise<SimpleWorkflow[]> {
  const workflows = await octokit.paginate(octokit.actions.listRepoWorkflows, {
    owner: repository.owner.login,
    repo: repository.name
  });

  return workflows.map(({ name, state, badge_url, html_url }) => ({
    repo: repository.full_name,
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
      rows: workflows.map(({ repo, name, state, badge_url, html_url }) => ({
        Repository: repo,
        Workflow: `[![${name}](${badge_url})](${html_url})`,
        State: state === 'active' ? `✅ ${state}` : `❌ ${state}`,
      }))
    }
  }]);
}

