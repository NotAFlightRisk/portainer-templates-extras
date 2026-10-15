import { describe, expect, it } from 'vitest';
import { highlight, inline } from '../src/lib/highlight.ts';
import { toApp } from '../src/lib/server/templates.ts';
import type { Template } from '../src/lib/types.ts';

const template: Template = {
  type: 3,
  title: 'Etherpad',
  name: 'etherpad',
  description: 'Collaborative text editor. Source: https://github.com/ether/etherpad',
  categories: ['Documents'],
  platform: 'linux',
  logo: 'https://example.com/logo.svg',
  note: 'Open <code>http://&lt;host&gt;:9001</code>. <a href="https://docs.etherpad.org" target="_blank" onclick="x()">Docs</a><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">bad</a>',
  restart_policy: 'unless-stopped',
  repository: { url: 'https://github.com/x/y', stackfile: 'apps/etherpad/compose.yml' }
};

describe('toApp', () => {
  const app = toApp(template, false);

  it('splits the source link off the description', () => {
    expect(app.blurb).toBe('Collaborative text editor.');
    expect(app.source).toBe('https://github.com/ether/etherpad');
    expect(app.kind).toBe('stack');
  });

  it('keeps the formatting in a note and drops anything that runs code', () => {
    expect(app.note).toContain('<code>http://&lt;host&gt;:9001</code>');
    expect(app.note).toContain('<a href="https://docs.etherpad.org">Docs</a>');
    expect(app.note).not.toMatch(/script|onclick|onerror|javascript:|<img/);
  });
});

describe('highlight', () => {
  it('escapes code before adding any markup', () => {
    const html = highlight('key: "<script>alert(1)</script>"', 'yaml');
    expect(html).toBe(
      '<span class="key">key</span>: &quot;&lt;script&gt;alert(1)&lt;/script&gt;&quot;'
    );
  });

  it('colours yaml keys, variables and comments', () => {
    expect(highlight('  port: ${PORT:-80}', 'yaml')).toBe(
      '<span class="key">  port</span>: <span class="var">${PORT:-80}</span>'
    );
    expect(highlight('# a comment: here', 'yaml')).toBe(
      '<span class="comment"># a comment: here</span>'
    );
  });

  it('colours the command and its flags but not dashes inside words', () => {
    expect(highlight('docker run -d my-app', 'shell')).toBe(
      '<span class="key">docker</span> run <span class="flag">-d</span> my-app'
    );
  });

  it('turns backticks into code and escapes the rest', () => {
    expect(inline('open `http://<host>` & go')).toBe(
      'open <code>http://&lt;host&gt;</code> &amp; go'
    );
  });
});
