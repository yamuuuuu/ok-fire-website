import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from 'cheerio';
import { WorkCard } from '../src/components/public/work-preview-card';

const work = {
  slug: 'example-work', title: '소방 시공', category: 'FIRE_ELECTRIC' as const,
  location: null, buildingType: null, summary: null,
  description: 'https://example.com/source', updatedAt: new Date('2026-10-20'),
};

test('thumbnail opens source while title and details keep the internal destination', () => {
  const html = renderToStaticMarkup(createElement(WorkCard, { work, preview: {
    href: 'https://example.com/source', hostname: 'example.com',
    title: '<script>alert(1)</script>', image: 'data:image/webp;base64,UklGRg==',
  } }));
  const $ = load(html);
  assert.equal($('a[href="https://example.com/source"] img').length, 1);
  assert.equal($('h2 a').attr('href'), '/works/example-work');
  assert.equal($('script').length, 0);
  assert.ok(html.includes('&lt;script&gt;'));
});

test('failed previews retain source links, and linkless works open their detail page', () => {
  const $ = load(renderToStaticMarkup(createElement(WorkCard, { work })));
  assert.equal($('a').first().attr('href'), 'https://example.com/source');
  assert.equal($('img').length, 0);
  const plain = load(renderToStaticMarkup(createElement(WorkCard, { work: { ...work, description: '작업 설명' } })));
  assert.equal(plain('a').first().attr('href'), '/works/example-work');
});
