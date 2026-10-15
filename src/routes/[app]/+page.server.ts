import { error } from '@sveltejs/kit';
import { requiredEnv, webPort } from '#lib/install.js';
import { installTabs } from '#lib/server/install.js';
import { catalogue, stack as fetchStack, toCard } from '#lib/server/templates.js';
import type { App } from '#lib/types.js';

export async function load({ params }) {
  const { apps, mainCount } = await catalogue();
  const app = apps.find(({ slug }) => slug === params.app);
  if (!app) error(404, "That app isn't in the list");

  const stack = app.kind === 'stack' ? await fetchStack(app) : undefined;
  const shared = (other: App) => other.categories.filter((c) => app.categories.includes(c)).length;
  const related = apps
    .filter((other) => other !== app)
    .toSorted((a, b) => shared(b) - shared(a))
    .slice(0, 4);

  return {
    app,
    mainCount,
    tabs: installTabs(app, stack),
    services: stack?.services ?? [],
    port: webPort(app, stack),
    required: requiredEnv(app).map(({ name }) => name),
    related: related.map(toCard)
  };
}
