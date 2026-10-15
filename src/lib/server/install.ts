import { stringify } from 'yaml';
import {
  envDefault,
  portainerTab,
  recommendedUrl,
  requiredEnv,
  volumeNames,
  webPort
} from '#lib/install.js';
import { raw } from '#lib/site.js';
import type { App, Env, Stack, Tab, Template } from '#lib/types.js';

const shellSafe = /^[\w@%+=:,./-]+$/;
const quote = (value: string) =>
  shellSafe.test(value) ? value : `'${value.replaceAll("'", `'\\''`)}'`;

const port = (mapping: string) => mapping.replace(/\/tcp$/, '');

function mounts(template: Template) {
  const volumes = template.volumes ?? [];
  const names = volumeNames(template.name, volumes);
  return {
    named: names.filter((_, i) => !volumes[i].bind),
    mounts: volumes.map(({ container, readonly }, i) =>
      [names[i], container, readonly && 'ro'].filter(Boolean).join(':')
    )
  };
}

export function composeFile(template: Template) {
  const { named, mounts: volumes } = mounts(template);
  const service = {
    image: template.image,
    container_name: template.name,
    restart: template.restart_policy,
    hostname: template.hostname,
    command: template.command,
    privileged: template.privileged || undefined,
    stdin_open: template.interactive || undefined,
    tty: template.interactive || undefined,
    ports: template.ports?.map(port),
    environment:
      template.env && Object.fromEntries(template.env.map((env) => [env.name, envDefault(env)])),
    volumes: volumes.length ? volumes : undefined
  };
  const file = {
    services: { [template.name]: service },
    volumes: named.length ? Object.fromEntries(named.map((name) => [name, null])) : undefined
  };
  // YAML 1.1 quoting keeps compose from reading 8080:80 as a number, or "no" as false
  return stringify(file, { version: '1.1', nullStr: '' });
}

export function dockerRun(template: Template) {
  const flags = [
    ['--name', template.name],
    ['--restart', template.restart_policy],
    template.hostname && ['--hostname', quote(template.hostname)],
    template.privileged && ['--privileged'],
    template.interactive && ['-it'],
    ...(template.ports ?? []).map((mapping) => ['-p', port(mapping)]),
    ...(template.env ?? []).map((env) => ['-e', quote(`${env.name}=${envDefault(env)}`)]),
    ...mounts(template).mounts.map((mount) => ['-v', quote(mount)])
  ].filter((flag) => Array.isArray(flag));
  const image = [template.image, template.command].filter(Boolean).join(' ');
  return ['docker run -d', ...flags.map((flag) => flag.join(' ')), image].join(' \\\n  ');
}

/** Quoted only when compose's dotenv parser would otherwise eat a space, # or $ */
const dotenv = (value: string) => {
  if (!value || shellSafe.test(value)) return value;
  if (!value.includes("'")) return `'${value}'`;
  return `"${value.replace(/[\\"$]/g, '\\$&')}"`;
};

export const envFile = (envs: Env[]) =>
  envs
    .map((env) => {
      const about = [env.label, env.description].filter(Boolean).join(' - ');
      return `# ${about}\n${env.name}=${dotenv(envDefault(env))}`;
    })
    .join('\n\n');

export function installTabs(app: App, stack?: Stack): Tab[] {
  const { template, title, slug } = app;
  const needed = requiredEnv(app).map((env) => env.label.replace(/ \(required\)$/i, ''));
  const open = webPort(app, stack);
  const portainer = portainerTab(recommendedUrl(app), [
    `Open App Templates and pick ${title}.`,
    needed.length
      ? `Fill in ${needed.join(' and ')}. Everything else can stay as it is.`
      : 'The form works as it comes, so change only what you want to.',
    `Hit Deploy the ${app.kind}${open ? `, then open \`http://<your-server>:${open}\` in a browser` : ''}.`
  ]);

  if (!stack) {
    return [
      portainer,
      {
        id: 'compose',
        label: 'compose.yml',
        lang: 'yaml',
        code: composeFile(template),
        intro: 'Save this as `compose.yml`, then run `docker compose up -d` next to it.'
      },
      {
        id: 'run',
        label: 'docker run',
        lang: 'shell',
        code: dockerRun(template),
        intro: 'Or skip the file and start it with one command.'
      }
    ];
  }

  const envs = template.env ?? [];
  const stackfile = template.repository?.stackfile;
  return [
    portainer,
    {
      id: 'compose',
      label: 'compose.yml',
      lang: 'yaml',
      code: stack.compose,
      intro: `The same file Portainer deploys. It reads its settings from a \`.env\` next to it.`
    },
    ...(envs.length
      ? [
          {
            id: 'env',
            label: '.env',
            lang: 'env' as const,
            code: envFile(envs),
            intro: needed.length
              ? `Fill in the blanks, as ${title} won't start without them.`
              : 'All optional, the defaults are fine.'
          }
        ]
      : []),
    {
      id: 'run',
      label: 'terminal',
      lang: 'shell',
      code: [
        `mkdir ${slug} && cd ${slug}`,
        `curl -fsSL -o compose.yml ${raw}/${stackfile}`,
        ...(envs.length ? ['# save the .env tab here as .env first'] : []),
        'docker compose up -d'
      ].join('\n'),
      intro: 'Grab the file and start it.'
    }
  ];
}
