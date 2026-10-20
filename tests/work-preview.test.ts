import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchPreviewResource, isPublicAddress, previewUrl } from '../src/lib/preview-fetch';
import { firstWorkLink, metadataAddress, parsePreviewMetadata } from '../src/lib/work-preview';

test('preview selection follows body order, then summary, without requiring data migration', () => {
  assert.equal(firstWorkLink('기록 https://example.com/first\nhttps://example.com/second', 'https://example.com/summary'), 'https://example.com/first');
  assert.equal(firstWorkLink('사진 작업', 'https://example.com/summary'), 'https://example.com/summary');
  assert.equal(firstWorkLink('주소 없음', null), undefined);
});

test('private, loopback, metadata, mapped, multicast and reserved IPs are blocked', () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '192.0.2.1', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1', '2001:db8::1', 'ff02::1']) {
    assert.equal(isPublicAddress(address), false, address);
  }
  assert.equal(isPublicAddress('8.8.8.8'), true);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
});

test('fetch rejects private destinations before connecting', async () => {
  for (const url of ['http://127.0.0.1/', 'http://2130706433/', 'http://[::1]/']) {
    await assert.rejects(fetchPreviewResource(url, 'html'), /Non-public/);
  }
});

test('unsupported schemes, credentials and custom ports are rejected', () => {
  for (const url of ['file:///etc/passwd', 'javascript:alert(1)', 'https://user:pass@example.com', 'http://example.com:3000']) {
    assert.throws(() => previewUrl(url));
  }
});

test('Naver wrapper normalization is restricted to known hosts and post paths', () => {
  assert.equal(metadataAddress('https://blog.naver.com/oke8119/224448174095'), 'https://blog.naver.com/PostView.naver?blogId=oke8119&logNo=224448174095');
  assert.equal(metadataAddress('https://m.blog.naver.com/oke8119/224448174095'), 'https://blog.naver.com/PostView.naver?blogId=oke8119&logNo=224448174095');
  assert.equal(metadataAddress('https://blog.naver.com.evil.example/abc/123'), 'https://blog.naver.com.evil.example/abc/123');
});

test('metadata parsing handles entities and relative images without evaluating HTML', () => {
  const result = parsePreviewMetadata('<meta content="소방 &amp; 시공" property="og:title"><meta property="og:image" content="/photo.jpg?a=1&amp;b=2"><script>throw new Error("never run")</script>', 'https://example.com/post');
  assert.deepEqual(result, { title: '소방 & 시공', image: 'https://example.com/photo.jpg?a=1&b=2' });
  assert.deepEqual(parsePreviewMetadata('<title>기본 제목</title><meta property="og:image" content="javascript:alert(1)">', 'https://example.com'), { title: '기본 제목', image: null });
});
