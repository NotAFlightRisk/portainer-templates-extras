import { catalogue, toCard } from '#lib/server/templates.js';

export async function load() {
  const { apps, mainCount } = await catalogue();
  return {
    apps: apps.map(toCard),
    mainCount,
    inMain: apps.filter((app) => app.inMainList).length
  };
}
