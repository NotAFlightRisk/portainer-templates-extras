import type { RequestEvent } from '@sveltejs/kit';

interface Exception {
  type: string;
  value: string;
  stacktrace: { frames: object[] };
}

// Node is V8, so there's one stack format. Sentry wants the oldest call first
const frames = (stack = '') =>
  stack
    .split('\n')
    .slice(1)
    .reverse()
    .flatMap((line) => {
      const [, fn, filename, lineno, colno] =
        /at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/.exec(line) ?? [];
      return filename
        ? [{ function: fn, filename, lineno: +lineno, colno: +colno, in_app: true }]
        : [];
    });

// Each cause is its own exception, root cause first
const chain = (error: unknown): Exception[] => {
  const err = error instanceof Error ? error : new Error(String(error));
  const self = { type: err.name, value: err.message, stacktrace: { frames: frames(err.stack) } };
  return err.cause ? [...chain(err.cause), self] : [self];
};

/** Sends one error straight to Bugsink, without pulling the Sentry SDK into every function */
export function report(error: unknown, { url, request }: RequestEvent) {
  const { origin, pathname, username } = new URL(import.meta.env.PUBLIC_SENTRY_DSN);
  const event = {
    platform: 'javascript',
    level: 'error',
    tags: { runtime: 'vercel' },
    request: {
      url: url.href,
      method: request.method,
      headers: { 'User-Agent': request.headers.get('user-agent') }
    },
    exception: { values: chain(error) }
  };
  return fetch(`${origin}/api${pathname}/store/?sentry_key=${username}&sentry_version=7`, {
    method: 'POST',
    body: JSON.stringify(event)
  }).catch(() => {});
}
