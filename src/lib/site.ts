export const site = {
  name: 'Portainer Templates Extras',
  url: 'https://portainer-templates-extras.peng.ly',
  repo: 'https://github.com/NotAFlightRisk/portainer-templates-extras',
  requestApp:
    'https://github.com/NotAFlightRisk/portainer-templates-extras/issues/new?template=request_app.yml',
  mainList: 'https://github.com/lissy93/portainer-templates',
  author: 'https://github.com/NotAFlightRisk'
};

export const raw =
  'https://raw.githubusercontent.com/NotAFlightRisk/portainer-templates-extras/main';

export const templateUrls = {
  extras: `${raw}/templates.json`,
  main: 'https://raw.githubusercontent.com/Lissy93/portainer-templates/main/templates.json'
};

const logo = (slug: string) => `https://portfolio.peng.ly/logos/${slug}.svg`;

export const moreApps = [
  {
    name: 'Patchcall',
    url: 'https://patchcall.peng.ly',
    logo: logo('patchcall'),
    about: "Security alerts for your self-hosted apps, only when there's a fix"
  },
  {
    name: 'statusquo',
    url: 'https://statusquo.peng.ly',
    logo: logo('statusquo'),
    about: 'All the status pages you rely on, on one board'
  },
  {
    name: 'peng-top',
    url: 'https://github.com/NotAFlightRisk/peng-top',
    logo: logo('peng-top'),
    about: 'A system monitor in your browser, like htop with proper graphs'
  },
  {
    name: 'Token Usage Dashboard',
    url: 'https://github.com/NotAFlightRisk/token-usage-dashboard',
    logo: logo('token-usage-dashboard'),
    about: 'See where your Claude Code, Codex and OpenCode tokens go'
  }
];
