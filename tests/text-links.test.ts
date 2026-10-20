import assert from 'node:assert/strict';
import test from 'node:test';
import { textLinks } from '../src/lib/text-links';

test('links blog URLs and preserves text, line breaks, query strings and punctuation', () => {
  const text = '현장 기록\n(https://blog.naver.com/okfire/123).\nhttps://example.com/?a=1&b=2';
  const parts = textLinks(text);
  assert.equal(parts.map(part => part.text).join(''), text);
  assert.deepEqual(parts.filter(part => part.href).map(part => part.href), [
    'https://blog.naver.com/okfire/123', 'https://example.com/?a=1&b=2',
  ]);
});

test('keeps balanced parentheses inside URLs', () => {
  assert.equal(textLinks('(https://example.com/wiki/Fire_(safety))')[1].href, 'https://example.com/wiki/Fire_(safety)');
});

test('unsafe schemes, invalid URLs and credentials do not become links', () => {
  const text = 'javascript:alert(1) data:text/html,test https:// http://user:password@example.com';
  assert.equal(textLinks(text).some(part => part.href), false);
  assert.equal(textLinks(text).map(part => part.text).join(''), text);
});
