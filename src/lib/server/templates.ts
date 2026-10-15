import { filterXSS } from 'xss';
import { parse } from 'yaml';
import { raw, site, templateUrls } from '#lib/site.js';
import type { App, Card, Stack, Template } from '#lib/types.js';

interface Catalogue {
  apps: App[];
  mainCount?: number;
}

type ComposePort =
  string | number | { target: number; published?: string | number; protocol?: string };

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
  filterXSS(html, {
    whiteList: { a: ['href'], b: [], code: [], i: [], br: [] },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
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

/** Titles the main list took from us, as it stamps each entry with the repo it came from */
const fromUs = (main: (Template & { maintainer?: string })[]) =>
  new Set(
    main
      .filter(({ maintainer }) => maintainer?.toLowerCase().startsWith(site.repo.toLowerCase()))
      .map(({ title }) => squash(title))
  );

async function fetchCatalogue(): Promise<Catalogue> {
  const [ours, main] = await Promise.all([
    templates(templateUrls.extras),
    // Without the main list nobody gets pointed at it, which is never the wrong advice
    templates(templateUrls.main).catch(() => undefined)
  ]);
  const inMain = fromUs(main ?? []);
  const apps = ours
    .map((template) => toApp(template, inMain.has(squash(template.title))))
    .sort((a, b) => a.title.localeCompare(b.title));
  return { apps, mainCount: main?.length };
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

/** Compose's long port syntax as the short one, so `{ target: 80, published: 8080 }` is 8080:80 */
export const shortPort = (port: ComposePort) => {
  if (typeof port !== 'object') return String(port);
  const mapping = [port.published, port.target].filter((part) => part !== undefined).join(':');
  return port.protocol && port.protocol !== 'tcp' ? `${mapping}/${port.protocol}` : mapping;
};

export async function stack(app: App): Promise<Stack> {
  const compose = await (await get(`${raw}/${app.template.repository?.stackfile}`)).text();
  const { services } = parse(compose) as {
    services: Record<string, { image?: string; ports?: ComposePort[] }>;
  };
  return {
    compose,
    services: Object.entries(services).map(([name, service]) => ({
      name,
      image: service.image,
      ports: (service.ports ?? []).map(shortPort)
    }))
  };
}
