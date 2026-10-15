import { afterEach, describe, expect, it, vi } from 'vitest';
import { webPort } from '../src/lib/install.ts';
import { envFile } from '../src/lib/server/install.ts';
import { catalogue, shortPort, toApp } from '../src/lib/server/templates.ts';
import { templateUrls } from '../src/lib/site.ts';
import type { Template } from '../src/lib/types.ts';

const template = (title: string, extra: object = {}) => ({
  type: 1,
  title,
  name: title.toLowerCase(),
  description: `${title}. Source: https://example.com/${title}`,
  categories: ['Tools'],
  platform: 'linux',
  logo: 'https://example.com/logo.png',
  note: 'Hi',
  restart_policy: 'unless-stopped',
  image: 'x/y:1',
  ...extra
});

const serve = (main: Response | (() => Promise<never>)) =>
  vi.stubGlobal('fetch', (url: string) => {
    if (url === templateUrls.extras)
      return Promise.resolve(
        Response.json({ templates: [template('Wallos'), template('Super Productivity')] })
      );
    return typeof main === 'function' ? main() : Promise.resolve(main);
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// Each test jumps past the memo so it sees its own fetches
let clock = Date.now();
const fresh = () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime((clock += 3_600_000));
};

describe('which apps the main list has', () => {
  it('counts only entries the main list took from this repo', async () => {
    fresh();
    serve(
      Response.json({
        templates: [
          template('Wallos', { maintainer: 'https://github.com/someone-else/templates/' }),
          template('super-productivity', {
            maintainer: 'https://github.com/NotAFlightRisk/portainer-templates-extras/'
          })
        ]
      })
    );
    const { apps, mainCount } = await catalogue();
    expect(mainCount).toBe(2);
    expect(apps.map((app) => [app.title, app.inMainList])).toEqual([
      ['Super Productivity', true],
      ['Wallos', false]
    ]);
  });

  it('still renders, pointing everyone at this list, when the main list is down', async () => {
    fresh();
    serve(new Response('nope', { status: 503 }));
    const { apps, mainCount } = await catalogue();
    expect(mainCount).toBeUndefined();
    expect(apps.every((app) => !app.inMainList)).toBe(true);
  });
});

describe('the port a browser opens', () => {
  const app = (ports: string[]) => toApp(template('X', { ports }) as Template, false);

  it('skips UDP and ports with no host side', () => {
    const stack = {
      compose: '',
      services: [{ name: 'x', ports: ['53:53/udp', '8080', '${WEB:-3000}:3000'] }]
    };
    expect(webPort(app([]), stack)).toBe('3000');
    expect(webPort(app(['53:53/udp', '8282:80/tcp']))).toBe('8282');
    expect(webPort(app(['53:53/udp']))).toBeUndefined();
  });

  it('reads compose long syntax as the short one', () => {
    expect(shortPort({ target: 80, published: 8080 })).toBe('8080:80');
    expect(shortPort({ target: 53, published: '53', protocol: 'udp' })).toBe('53:53/udp');
    expect(shortPort({ target: 80 })).toBe('80');
    expect(shortPort(3000)).toBe('3000');
  });
});

describe('.env file', () => {
  it('quotes values compose would otherwise split, comment out or expand', () => {
    const lines = envFile([
      { name: 'A', label: 'A', default: 'plain-1.0' },
      { name: 'B', label: 'B', default: 'two words # not a comment' },
      { name: 'C', label: 'C', default: "it's ${HOME}" }
    ]);
    expect(lines).toContain('\nA=plain-1.0');
    expect(lines).toContain("\nB='two words # not a comment'");
    expect(lines).toContain('\nC="it\'s \\${HOME}"');
  });
});
