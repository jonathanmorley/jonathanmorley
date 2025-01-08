import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import json2md from 'json2md';
import { type Unpacked } from './types.ts';
import { type SimpleRepository } from './repositories.ts';

export type SimpleCheck = Pick<Unpacked<RestEndpointMethodTypes['checks']['listForRef']['response']['data']['check_runs']>, 'name' | 'status' | 'conclusion' | 'html_url'> & { repo: string, repo_url: string };

export async function getChecks(octokit: Octokit, repository: SimpleRepository): Promise<SimpleCheck[]> {
  const checks = await octokit.paginate(octokit.checks.listForRef, {
    owner: repository.owner.login,
    repo: repository.name,
    ref: `heads/${repository.default_branch}`
  });

  return checks.map(({ name, status, conclusion, html_url }) => ({
    repo: repository.full_name,
    repo_url: repository.html_url,
    name,
    status,
    conclusion,
    html_url
  }));
}

export function checksToMarkdown(checks: SimpleCheck[]): string {
  return json2md([{
    table: {
      headers: ['Repository', 'Check', 'Status', 'Conclusion'],
      rows: checks.map(({ repo, repo_url, name, status, conclusion, html_url }) => ({
        Repository: `[${repo}](${repo_url})`,
        Check: `[${name}](${html_url})`,
        Status: status,
        Conclusion: conclusion === 'success' ? `✅ ${conclusion}` : `❌ ${conclusion}`
      }))
    }
  }]);
}