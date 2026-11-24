import { edgeCache } from '#lib/server/templates.js';

export function load({ setHeaders }) {
  setHeaders(edgeCache);
}
