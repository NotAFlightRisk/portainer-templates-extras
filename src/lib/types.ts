export interface Env {
  name: string;
  label: string;
  description?: string;
  default?: string;
  preset?: boolean;
  select?: { text: string; value: string; default?: boolean }[];
}

export interface Volume {
  container: string;
  bind?: string;
  readonly?: boolean;
}

/** One entry in a Portainer v3 templates.json */
export interface Template {
  type: 1 | 3;
  title: string;
  name: string;
  description: string;
  categories: string[];
  platform: string;
  logo: string;
  note: string;
  restart_policy: string;
  image?: string;
  ports?: string[];
  volumes?: Volume[];
  env?: Env[];
  repository?: { url: string; stackfile: string };
  command?: string;
  hostname?: string;
  privileged?: boolean;
  interactive?: boolean;
}

export type Kind = 'container' | 'stack';

export interface Card {
  slug: string;
  title: string;
  blurb: string;
  logo: string;
  categories: string[];
  kind: Kind;
}

export interface App extends Card {
  source: string;
  note: string;
  inMainList: boolean;
  template: Template;
}

export interface Service {
  name: string;
  image?: string;
  ports: string[];
}

export interface Stack {
  compose: string;
  services: Service[];
}

export type Lang = 'yaml' | 'shell' | 'env' | 'text';

export interface Tab {
  id: string;
  label: string;
  lang: Lang;
  code: string;
  intro: string;
  note?: string;
  steps?: string[];
}
