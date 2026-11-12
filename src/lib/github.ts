// Build-time GitHub data: the featured repos and the public contribution year.
// Nothing here runs in the browser.
//
// If GitHub cannot be reached, the build uses src/data/github.json, the last
// good answer committed in the repo. A GitHub outage never breaks a deploy.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projects, site } from './content';

export interface Repo {
  repo: string;
  title: string;
  blurb: string;
  /** The repo on GitHub. */
  url: string;
  /** A live site, when projects.yaml names one. A repo's own homepage field is not trusted: forks inherit it. */
  live?: string;
  language: string | null;
  stars: number;
  pushedAt: string;
}

export interface Day {
  date: string;
  /** 0 to 4, as GitHub shades its own calendar. */
  level: number;
}

export interface GithubData {
  fetchedAt: string;
  repos: Repo[];
  days: Day[];
}

const CACHE = resolve(process.cwd(), 'src/data/github.json');
const TIMEOUT_MS = 8000;

async function get(url: string, headers: Record<string, string> = {}): Promise<Response> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'portfolio-build', ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return response;
}

async function fetchRepos(): Promise<Repo[]> {
  // A token only raises the rate limit. Every repo listed is public.
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const repos: Repo[] = [];
  for (const p of projects) {
    const owner = p.owner ?? site.github;
    const r = (await (await get(`https://api.github.com/repos/${owner}/${p.repo}`, headers)).json()) as {
      private: boolean;
      description: string | null;
      html_url: string;
      language: string | null;
      stargazers_count: number;
      pushed_at: string;
    };
    if (r.private) continue; // only public repos ship
    repos.push({
      repo: p.repo,
      title: p.title ?? p.repo,
      blurb: p.blurb ?? r.description ?? '',
      url: r.html_url,
      live: p.url,
      language: r.language,
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
    });
  }
  return repos;
}

/**
 * The contribution calendar exactly as the public profile shows it.
 * The GraphQL calendar, asked with the owner's token, would add private
 * activity. This page cannot.
 */
async function fetchDays(): Promise<Day[]> {
  const html = await (await get(`https://github.com/users/${site.github}/contributions`)).text();
  const days: Day[] = [];
  for (const cell of html.match(/<td[^>]*data-date="[^"]+"[^>]*>/g) ?? []) {
    const date = /data-date="(\d{4}-\d{2}-\d{2})"/.exec(cell)?.[1];
    const level = /data-level="(\d)"/.exec(cell)?.[1];
    if (date && level) days.push({ date, level: Number(level) });
  }
  if (days.length < 300) throw new Error(`contribution calendar had ${days.length} days`);
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

function readCache(): GithubData | null {
  return existsSync(CACHE) ? (JSON.parse(readFileSync(CACHE, 'utf8')) as GithubData) : null;
}

async function load(): Promise<GithubData> {
  const cached = readCache();
  // `GITHUB_OFFLINE=1` builds from the cache alone. Dev uses it to stay off the network.
  if (process.env.GITHUB_OFFLINE && cached) return cached;
  try {
    const [repos, days] = await Promise.all([fetchRepos(), fetchDays()]);
    const fresh: GithubData = { fetchedAt: new Date().toISOString(), repos, days };
    writeFileSync(CACHE, JSON.stringify(fresh, null, 2) + '\n');
    return fresh;
  } catch (error) {
    if (!cached) throw error;
    console.warn(`[github] using cached data from ${cached.fetchedAt}: ${(error as Error).message}`);
    return cached;
  }
}

let pending: Promise<GithubData> | undefined;

/** Fetched once per build, however many components ask. */
export function github(): Promise<GithubData> {
  return (pending ??= load());
}

/** "3 days ago", measured from the fetch, so a cached build does not lie about freshness. */
export function ago(iso: string, from: string): string {
  const days = Math.max(0, Math.round((Date.parse(from) - Date.parse(iso)) / 86_400_000));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 45) return `${days} days ago`;
  if (days < 540) return `${Math.round(days / 30)} months ago`;
  return `${Math.round(days / 365)} years ago`;
}
