import sanitizeHtml from 'sanitize-html';
import { parse } from 'yaml';
import { raw, templateUrls } from '#lib/site.js';
import type { App, Card, Stack, Template } from '#lib/types.js';

interface Catalogue {
  apps: App[];
  mainCount: number;
}

const freshFor = 10 * 60_000;
let cached: { at: number; catalogue: Promise<Catalogue> } | undefined;

/** How the main list dedupes titles, so "Super Productivity" matches "super-productivity" */
const squash = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, '');

async function get(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res;
}

const templates = async (url: string): Promise<Template[]> =>
  (await (await get(url)).json()).templates;

const tidy = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: ['a', 'b', 'code', 'i', 'br'],
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['https', 'http']
  });

export function toApp(template: Template, inMainList: boolean): App {
  const [, blurb, source] = /^(.*) Source: (\S+)$/s.exec(template.description) ?? [];
  return {
    slug: template.name,
    title: template.title,
    blurb: blurb ?? template.description,
    logo: template.logo,
    categories: template.categories,
    kind: template.type === 3 ? 'stack' : 'container',
    source: source ?? template.repository?.url ?? '',
    note: tidy(template.note),
    inMainList,
    template
  };
}

async function fetchCatalogue(): Promise<Catalogue> {
  const [ours, main] = await Promise.all([
    templates(templateUrls.extras),
    templates(templateUrls.main)
  ]);
  const inMain = new Set(main.map((template) => squash(template.title)));
  const apps = ours
    .map((template) => toApp(template, inMain.has(squash(template.title))))
    .sort((a, b) => a.title.localeCompare(b.title));
  return { apps, mainCount: main.length };
}

/** Both lists, kept for a few minutes so a burst of page renders downloads them once */
export function catalogue() {
  if (!cached || Date.now() - cached.at > freshFor) {
    const fresh = fetchCatalogue();
    cached = { at: Date.now(), catalogue: fresh };
    fresh.catch(() => {
      if (cached?.catalogue === fresh) cached = undefined;
    });
  }
  return cached.catalogue;
}

export const toCard = ({ slug, title, blurb, logo, categories, kind }: App): Card => ({
  slug,
  title,
  blurb,
  logo,
  categories,
  kind
});

export async function stack(app: App): Promise<Stack> {
  const compose = await (await get(`${raw}/${app.template.repository?.stackfile}`)).text();
  const { services } = parse(compose) as {
    services: Record<string, { image?: string; ports?: (string | number)[] }>;
  };
  return {
    compose,
    services: Object.entries(services).map(([name, service]) => ({
      name,
      image: service.image,
      ports: (service.ports ?? []).map(String)
    }))
  };
}
