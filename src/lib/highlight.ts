import type { Lang } from '#lib/types.js';

const entities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export const escape = (text: string) => text.replace(/[&<>"']/g, (char) => entities[char]);

const span = (kind: string) => (match: string) => `<span class="${kind}">${match}</span>`;

const rules: Record<Lang, [RegExp, string][]> = {
  yaml: [
    [/^\s*-?\s*[\w.-]+(?=:(\s|$))/, 'key'],
    [/\$\{[^}]*\}/g, 'var']
  ],
  env: [[/^\w+(?==)/, 'key']],
  shell: [
    [/^[\w-]+/, 'key'],
    [/(?<=\s)--?[\w-]+/g, 'flag']
  ],
  text: []
};

/** Escaped HTML with a few spans for colour. Comments are whole lines, so they skip the rest */
export function highlight(code: string, lang: Lang) {
  return code
    .split('\n')
    .map((line) => {
      const safe = escape(line);
      if (/^\s*#/.test(line)) return span('comment')(safe);
      return rules[lang].reduce((html, [pattern, kind]) => html.replace(pattern, span(kind)), safe);
    })
    .join('\n');
}

/** Escapes text and turns `backticks` into code, for the short lines around a code block */
export const inline = (text: string) =>
  escape(text).replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
