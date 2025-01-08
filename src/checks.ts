import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import json2md from 'json2md';

type Unpacked<T> = T extends (infer U)[] ? U : T;
export type SimpleCheck = Pick<Unpacked<RestEndpointMethodTypes['checks']['listForRef']['response']['data']['check_runs']>, 'name' | 'status' | 'conclusion' | 'html_url'> & { repo: string };

export async function getChecks(octokit: Octokit, repository: { owner: { login: string }, name: string, full_name: string, default_branch?: string }): Promise<SimpleCheck[]> {
  const checks = await octokit.paginate(octokit.checks.listForRef, {
    owner: repository.owner.login,
    repo: repository.name,
    ref: `heads/${repository.default_branch}`
  });

  return checks.map(({ name, status, conclusion, html_url }) => ({
    repo: repository.full_name,
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
      rows: checks.map(({ repo, name, status, conclusion, html_url }) => ({
        Repository: repo,
        Check: `[${name}](${html_url})`,
        Status: status,
        Conclusion: conclusion === 'success' ? `✅ ${conclusion}` : `❌ ${conclusion}`
      }))
    }
  }]);
}