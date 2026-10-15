import { sentryVitePlugin } from '@sentry/vite-plugin';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

type Origin = `${string}.${string}`;

const plausible = process.env.PUBLIC_PLAUSIBLE_SCRIPT ?? '';
const pulse = plausible ? [new URL(plausible).origin as Origin] : [];
const sentry = process.env.PUBLIC_SENTRY_DSN ?? '';
const oops = sentry ? [new URL(sentry).origin as Origin] : [];
const uploadMaps = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_URL);

export default defineConfig({
  define: {
    'import.meta.env.PUBLIC_PLAUSIBLE_SCRIPT': JSON.stringify(plausible),
    'import.meta.env.PUBLIC_SENTRY_DSN': JSON.stringify(sentry)
  },
  build: {
    // Inlined fontsource subsets would be data: URIs, which font-src 'self' blocks
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
    sourcemap: uploadMaps && 'hidden'
  },
  plugins: [
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true
      },
      adapter: adapter(),
      csp: {
        mode: 'hash',
        directives: {
          'default-src': ['self'],
          'script-src': ['self', ...pulse],
          'connect-src': ['self', ...pulse, ...oops],
          'img-src': ['self', 'data:', 'https:'],
          'style-src': ['self', 'unsafe-inline'],
          'font-src': ['self'],
          'object-src': ['none'],
          'base-uri': ['none'],
          'form-action': ['self'],
          'frame-ancestors': ['none']
        }
      }
    }),
    uploadMaps &&
      sentryVitePlugin({
        telemetry: false,
        release: { create: false, finalize: false, setCommits: false, deploy: false },
        bundleSizeOptimizations: { excludeDebugStatements: true, excludeTracing: true },
        sourcemaps: {
          assets: '.svelte-kit/output/client/**',
          filesToDeleteAfterUpload: '.svelte-kit/output/**/*.map'
        }
      })
  ],
  test: { include: ['tests/**/*.test.ts'] }
});
