import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { report } from '#lib/server/report.js';

const headers = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin'
};

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  return response;
};

export const handleError: HandleServerError = async ({ kind, error, event }) => {
  if (import.meta.env.PUBLIC_SENTRY_DSN && kind === 'unknown') await report(error, event);
};
