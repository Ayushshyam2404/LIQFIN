import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  decodeQuotedPrintable,
  decodeBase64,
  stripHtml,
  extractEmailBody,
} from './mimeParser';

// ---------- decodeQuotedPrintable ----------
describe('decodeQuotedPrintable', () => {
  it('removes soft line breaks', () => {
    assert.strictEqual(decodeQuotedPrintable('hello=\r\nworld'), 'helloworld');
  });

  it('removes soft line breaks (LF only)', () => {
    assert.strictEqual(decodeQuotedPrintable('foo=\nbar'), 'foobar');
  });

  it('decodes hex-encoded characters (byte-level)', () => {
    // decodeQuotedPrintable maps each =XX to String.fromCharCode, not UTF-8
    assert.strictEqual(decodeQuotedPrintable('=3D'), '=');
    assert.strictEqual(decodeQuotedPrintable('=2E'), '.');
  });

  it('decodes an equals sign (=3D)', () => {
    assert.strictEqual(decodeQuotedPrintable('a=3Db'), 'a=b');
  });

  it('returns plain text unchanged', () => {
    assert.strictEqual(decodeQuotedPrintable('hello world'), 'hello world');
  });
});

// ---------- decodeBase64 ----------
describe('decodeBase64', () => {
  it('decodes a base64-encoded string', () => {
    const encoded = Buffer.from('Hello, World!').toString('base64');
    assert.strictEqual(decodeBase64(encoded), 'Hello, World!');
  });

  it('handles an empty string', () => {
    assert.strictEqual(decodeBase64(''), '');
  });
});

// ---------- stripHtml ----------
describe('stripHtml', () => {
  it('removes simple HTML tags', () => {
    assert.strictEqual(stripHtml('<p>hello</p>'), 'hello');
  });

  it('strips <style> blocks entirely', () => {
    const html = '<style>.red{color:red}</style><p>content</p>';
    assert.strictEqual(stripHtml(html), 'content');
  });

  it('strips <script> blocks entirely', () => {
    const html = '<script>alert("xss")</script><p>safe</p>';
    assert.strictEqual(stripHtml(html), 'safe');
  });

  it('decodes &nbsp;', () => {
    assert.strictEqual(stripHtml('a&nbsp;b'), 'a b');
  });

  it('decodes &amp; &lt; &gt; &quot;', () => {
    assert.strictEqual(stripHtml('&amp; &lt; &gt; &quot;'), '& < > "');
  });

  it('collapses whitespace', () => {
    assert.strictEqual(stripHtml('  a   b  '), 'a b');
  });
});

// ---------- extractEmailBody ----------
describe('extractEmailBody', () => {
  it('returns plain text if no Content-Type header is present', () => {
    const raw = 'This is a plain text email.';
    assert.strictEqual(extractEmailBody(raw), raw);
  });

  it('extracts text/plain part from a multipart email', () => {
    const raw = [
      'Content-Type: multipart/alternative; boundary="abc123"',
      '',
      '--abc123',
      'Content-Type: text/plain',
      'Content-Transfer-Encoding: 7bit',
      '',
      'Plain text body here.',
      '--abc123',
      'Content-Type: text/html',
      'Content-Transfer-Encoding: 7bit',
      '',
      '<html><body><p>HTML body here.</p></body></html>',
      '--abc123--',
    ].join('\r\n');
    const result = extractEmailBody(raw);
    assert.ok(result.includes('Plain text body here'), `Got: ${result}`);
  });

  it('falls back to HTML part when no text/plain is available', () => {
    const raw = [
      'Content-Type: multipart/alternative; boundary="xyz"',
      '',
      '--xyz',
      'Content-Type: text/html',
      'Content-Transfer-Encoding: 7bit',
      '',
      '<p>HTML only</p>',
      '--xyz--',
    ].join('\r\n');
    const result = extractEmailBody(raw);
    assert.ok(result.includes('HTML only'), `Got: ${result}`);
  });

  it('decodes a quoted-printable encoded part', () => {
    const raw = [
      'Content-Type: multipart/alternative; boundary="qp"',
      '',
      '--qp',
      'Content-Type: text/plain',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      'Hello=20World',
      '--qp--',
    ].join('\r\n');
    const result = extractEmailBody(raw);
    assert.ok(result.includes('Hello World'), `Got: ${result}`);
  });

  it('decodes a base64 encoded part', () => {
    const text = 'Base64 decoded content';
    const b64 = Buffer.from(text).toString('base64');
    const raw = [
      'Content-Type: multipart/alternative; boundary="b64"',
      '',
      '--b64',
      'Content-Type: text/plain',
      'Content-Transfer-Encoding: base64',
      '',
      b64,
      '--b64--',
    ].join('\r\n');
    const result = extractEmailBody(raw);
    assert.ok(result.includes('Base64 decoded content'), `Got: ${result}`);
  });

  it('handles a single-part email with headers', () => {
    const raw = [
      'Content-Type: text/plain',
      'Content-Transfer-Encoding: 7bit',
      '',
      '',
      'Simple body after headers.',
    ].join('\r\n');
    const result = extractEmailBody(raw);
    assert.ok(result.includes('Simple body after headers'), `Got: ${result}`);
  });
});
