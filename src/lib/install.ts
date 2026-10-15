import { templateUrls } from '#lib/site.js';
import type { App, Env, Stack, Tab, Volume } from '#lib/types.js';

export const envDefault = (env: Env) =>
  env.select?.find((option) => option.default)?.value ?? env.default ?? '';

/** Fields Portainer can't leave blank, which only stacks have (compose's ${VAR:?}) */
export const requiredEnv = (app: App) =>
  app.kind === 'stack' ? (app.template.env ?? []).filter((env) => !env.default && !env.select) : [];

/** Swaps compose's ${VAR:-default} for its default, as an empty .env would */
export const withDefaults = (text: string) =>
  text.replace(/\$\{\w+(?::?-([^}]*))?[^}]*\}/g, (_, fallback = '') => fallback);

/** The host side of a port mapping, so `127.0.0.1:8080:80/tcp` gives 8080 */
export const hostPort = (mapping: string) => {
  const parts = withDefaults(mapping)
    .replace(/\/\w+$/, '')
    .split(':');
  return parts.at(-2) ?? parts[0];
};

export const webPort = (app: App, stack?: Stack) => {
  const ports = stack ? stack.services.flatMap((service) => service.ports) : app.template.ports;
  return ports?.length ? hostPort(ports[0]) : undefined;
};

/** Named volumes for a container, like wallos-db, since Portainer's own names are random */
export function volumeNames(slug: string, volumes: Volume[]) {
  const taken = new Set<string>();
  return volumes.map(({ container, bind }) => {
    if (bind) return bind;
    const last = container.split('/').filter(Boolean).at(-1) ?? 'data';
    const base = `${slug}-${last.replace(/[^\w.-]/g, '-')}`;
    let name = base;
    for (let n = 2; taken.has(name); n++) name = `${base}-${n}`;
    taken.add(name);
    return name;
  });
}

/** The Portainer settings tab, shared by the home page and every app */
export function portainerTab(url: string, steps: string[]): Tab {
  return {
    id: 'portainer',
    label: 'Portainer',
    lang: 'text',
    code: url,
    intro: 'In Portainer, head to Settings --> App Templates, paste this in as the URL and save.',
    steps
  };
}

export const recommendedUrl = (app: App) =>
  app.inMainList ? templateUrls.main : templateUrls.extras;
