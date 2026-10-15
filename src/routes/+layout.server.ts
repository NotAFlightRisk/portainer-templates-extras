import type { Config } from '@sveltejs/adapter-vercel';

// Pages rebuild at most hourly, so a new template shows up without a deploy
export const config: Config = { isr: { expiration: 3600, allowQuery: [] } };
