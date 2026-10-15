import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { hostPort, volumeNames, withDefaults } from '../src/lib/install.ts';
import { composeFile, dockerRun, envFile, installTabs } from '../src/lib/server/install.ts';
import { toApp } from '../src/lib/server/templates.ts';
import type { Template } from '../src/lib/types.ts';

const wallos: Template = {
  type: 1,
  title: 'Wallos',
  name: 'wallos',
  description: 'Subscription tracker. Source: https://github.com/ellite/wallos',
  categories: ['Finance'],
  platform: 'linux',
  logo: 'https://example.com/wallos.png',
  note: 'Open it on <code>8282</code>',
  restart_policy: 'no',
  image: 'bellamy/wallos:latest',
  ports: ['8282:80/tcp', '5353:53/udp'],
  volumes: [{ container: '/var/www/html/db' }, { container: '/srv/db' }, { container: '/' }],
  env: [
    { name: 'TZ', label: 'Timezone', default: 'Europe/London' },
    { name: 'GREETING', label: 'Greeting', default: "it's a 'test'" },
    {
      name: 'MODE',
      label: 'Mode',
      select: [
        { text: 'Fast', value: 'fast' },
        { text: 'Slow', value: 'slow', default: true }
      ]
    }
  ]
};

const etherpad: Template = {
  ...wallos,
  type: 3,
  title: 'Etherpad',
  name: 'etherpad',
  image: undefined,
  ports: undefined,
  volumes: undefined,
  repository: { url: 'https://github.com/x/y', stackfile: 'apps/etherpad/compose.yml' },
  env: [
    { name: 'ADMIN_PASSWORD', label: 'Admin password (required)' },
    { name: 'PORT', label: 'Port', default: '9001' }
  ]
};

describe('compose file for a container', () => {
  const file = parse(composeFile(wallos), { version: '1.1' });
  const service = file.services.wallos;

  it('keeps every setting as a string, so compose reads it the way Portainer would', () => {
    expect(service.restart).toBe('no');
    expect(service.ports).toEqual(['8282:80', '5353:53/udp']);
    expect(service.environment).toEqual({
      TZ: 'Europe/London',
      GREETING: "it's a 'test'",
      MODE: 'slow'
    });
  });

  it('names each volume after the app and declares it', () => {
    expect(service.volumes).toEqual([
      'wallos-db:/var/www/html/db',
      'wallos-db-2:/srv/db',
      'wallos-data:/'
    ]);
    expect(Object.keys(file.volumes)).toEqual(['wallos-db', 'wallos-db-2', 'wallos-data']);
  });

  it('leaves bind mounts as host paths and out of the volumes list', () => {
    const bound = parse(
      composeFile({ ...wallos, volumes: [{ container: '/data', bind: '/srv/x', readonly: true }] })
    );
    expect(bound.services.wallos.volumes).toEqual(['/srv/x:/data:ro']);
    expect(bound.volumes).toBeUndefined();
  });
});

describe('docker run', () => {
  const command = dockerRun(wallos);

  it('quotes values the shell would otherwise split or eat', () => {
    expect(command).toContain(`-e 'GREETING=it'\\''s a '\\''test'\\'''`);
    expect(command).toContain('-e TZ=Europe/London');
  });

  it('ends with the image, one flag per line', () => {
    const lines = command.split(' \\\n  ');
    expect(lines[0]).toBe('docker run -d');
    expect(lines.at(-1)).toBe('bellamy/wallos:latest');
    expect(lines).toContain('-p 8282:80');
    expect(lines).toContain('-v wallos-db:/var/www/html/db');
  });
});

describe('ports', () => {
  it('reads the host side, through compose defaults and bind addresses', () => {
    expect(hostPort('8282:80/tcp')).toBe('8282');
    expect(hostPort('${PORT:-9001}:9001')).toBe('9001');
    expect(hostPort('127.0.0.1:8080:80')).toBe('8080');
    expect(hostPort('3000')).toBe('3000');
  });

  it('blanks variables with no default, like an empty .env does', () => {
    expect(withDefaults('${A:?set it} ${B} ${C-x} ${D:+y}')).toBe('  x ');
  });

  it('dedupes volume names that end the same way', () => {
    expect(volumeNames('app', [{ container: '/a/data' }, { container: '/b/data' }])).toEqual([
      'app-data',
      'app-data-2'
    ]);
  });
});

describe('install tabs', () => {
  const stack = {
    compose: 'services: {}',
    services: [{ name: 'etherpad', image: 'etherpad/etherpad:3', ports: ['${PORT:-9001}:9001'] }]
  };

  it('recommends the main list only for apps that are in it', () => {
    const [ours] = installTabs(toApp(wallos, false));
    const [main] = installTabs(toApp(wallos, true));
    expect(ours.code).toContain('NotAFlightRisk/portainer-templates-extras');
    expect(main.code).toContain('Lissy93/portainer-templates');
  });

  it('asks for the fields a stack cannot start without', () => {
    const [portainer] = installTabs(toApp(etherpad, false), stack);
    expect(portainer.steps?.[1]).toBe('Fill in Admin password. Everything else can stay as it is.');
    expect(portainer.steps?.[2]).toContain('`http://<your-server>:9001`');
  });

  it('gives a stack its .env file and the commands to fetch the compose file', () => {
    const tabs = installTabs(toApp(etherpad, false), stack);
    expect(tabs.map((tab) => tab.id)).toEqual(['portainer', 'compose', 'env', 'run']);
    expect(envFile(etherpad.env ?? [])).toContain('# Admin password (required)\nADMIN_PASSWORD=');
    expect(tabs.at(-1)?.code).toContain('/apps/etherpad/compose.yml');
  });
});
