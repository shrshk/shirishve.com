import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { load as parseYaml } from 'js-yaml';
import { z } from 'zod';

// Read from the project root so this works in dev, build and plain node scripts.
function load<T>(file: string, schema: z.ZodType<T>): T {
  const path = resolve(process.cwd(), 'src/content', file);
  return schema.parse(parseYaml(readFileSync(path, 'utf8')));
}

const siteSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  role: z.string(),
  url: z.url(),
  tagline: z.string(),
  bio: z.array(z.string()),
  loves: z.array(z.object({ topic: z.string(), why: z.string() })),
  location: z.string(),
  github: z.string(),
  socials: z.array(z.object({ platform: z.string(), url: z.url() })),
  email: z.string(),
  resume: z.object({ enabled: z.boolean(), path: z.string() }),
  analytics: z.string(),
  work: z.object({
    summary: z.string(),
    scale: z.array(z.object({ figure: z.string(), label: z.string() })),
    focus: z.array(z.string()),
    explainNote: z.string(),
  }),
});

const projectsSchema = z.object({
  projects: z.array(
    z.object({
      repo: z.string(),
      owner: z.string().optional(),
      title: z.string().optional(),
      blurb: z.string().optional(),
      url: z.url().optional(),
      /** A private repo: shown without a link, and never asked of GitHub. */
      private: z.boolean().optional(),
      language: z.string().optional(),
    }),
  ),
});

const soccerSchema = z.object({
  title: z.string(),
  line: z.string(),
  body: z.string(),
  note: z.string(),
  guessThePass: z.object({ url: z.string(), line: z.string() }),
});

export type Site = z.infer<typeof siteSchema>;
export type Project = z.infer<typeof projectsSchema>['projects'][number];
export type Soccer = z.infer<typeof soccerSchema>;

export const site = load('site.yaml', siteSchema);
export const projects = load('projects.yaml', projectsSchema).projects;
export const soccer = load('soccer.yaml', soccerSchema);

/** Copy that is not approved yet is marked `PLACEHOLDER:` in the YAML. Show it without the marker. */
export const show = (text: string) => text.replace(/^PLACEHOLDER:\s*/, '');
