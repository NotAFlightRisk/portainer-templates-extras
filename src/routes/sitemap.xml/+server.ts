import { catalogue } from '#lib/server/templates.js';
import { site } from '#lib/site.js';

export async function GET() {
  const { apps } = await catalogue();
  const urls = ['/', ...apps.map(({ slug }) => `/${slug}`)]
    .map((path) => `  <url><loc>${site.url}${path}</loc></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
