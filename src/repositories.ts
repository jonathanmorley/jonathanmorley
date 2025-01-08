import { RestEndpointMethodTypes } from "@octokit/rest";

export type SimpleRepository = Pick<RestEndpointMethodTypes['repos']['get']['response']['data'], 'owner' | 'name' | 'default_branch' | 'full_name' | 'html_url'>;