import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.mjs';

let server;
let origin;

before(async () => {
  server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Local test server did not bind to a TCP port.');
  origin = 'http://127.0.0.1:' + address.port;
});

after(async () => {
  if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('serves the dashboard with restrictive security headers', async () => {
  const response = await fetch(origin + '/');
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Seller Ops Desk/);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  assert.match(response.headers.get('content-security-policy') || '', /default-src 'self'/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('serves only the four allowlisted frontend assets', async () => {
  for (const [path, contentType] of [
    ['/index.html', /text\/html/],
    ['/app.js', /text\/javascript/],
    ['/core.js', /text\/javascript/],
    ['/styles.css', /text\/css/]
  ]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type') || '', contentType, path);
    assert.ok((await response.text()).length > 20, path);
  }
});

test('does not expose package files, tests, documentation, or traversal paths', async () => {
  for (const path of [
    '/package.json',
    '/server.mjs',
    '/tests/core.test.js',
    '/README.md',
    '/%2e%2e/package.json',
    '/%2e%2e/%2e%2e/package.json'
  ]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 404, path);
  }
});

test('rejects write methods and allows HEAD for static assets', async () => {
  const post = await fetch(origin + '/', { method: 'POST', body: 'ignore' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');

  const head = await fetch(origin + '/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
