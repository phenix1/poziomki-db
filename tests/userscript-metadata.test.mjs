import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(
  new URL('../dist/poziomki.user.js', import.meta.url),
);
const source = fs.readFileSync(scriptPath, 'utf8');
const header = source.match(/^\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/)?.[1] || '';

function metadata(name) {
  return header.match(new RegExp(`^// @${name}\\s+(.+)$`, 'm'))?.[1]?.trim();
}

test('userscript declares a new version for update checks', () => {
  assert.equal(metadata('version'), '4.2.6');
});

test('userscript downloads updates from the canonical GitHub file', () => {
  const expected = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/dist/poziomki.user.js';
  assert.equal(metadata('updateURL'), expected);
  assert.equal(metadata('downloadURL'), expected);
});
