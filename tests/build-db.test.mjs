import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(
  new URL('../tools/build-db.mjs', import.meta.url),
);

const catalog = {
  schema_version: 2,
  CONFIG: { version: '2.0' },
  COLLAB: { Azub: 'yes' },
  PRODUCERS: [
    {
      id: 'azub',
      name: 'Azub',
      collaboration_status: 'yes',
      official_url: null,
      country_code: 'CZ',
      aliases: [],
    },
  ],
  MODELS: [
    {
      id: 'azub--azub-5',
      producer_id: 'azub',
      name: 'Azub 5',
      type: 'bike',
      status: 'archived',
      verification_status: 'legacy_unverified',
      wheels: { front_in: 20, rear_in: 26 },
      curb_weight_kg: 14.5,
      limits: { rider_kg: 140, system_kg: 180, rack_kg: 25 },
      legacy_load_kg: 135,
      url: 'https://azub.eu/',
      arch: true,
      offroad: false,
      check: false,
      sources: [
        {
          url: 'https://azub.eu/',
          kind: 'unclassified',
          retrieved_at: null,
          quote: null,
        },
      ],
    },
  ],
};

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'poziomki-build-'));
  const catalogPath = join(directory, 'catalog.json');
  const outputPath = join(directory, 'db.json');
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  return { directory, catalogPath, outputPath };
}

function run(args, directory) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: directory,
    encoding: 'utf8',
  });
}

test('check mode fails when runtime database is stale', (t) => {
  const paths = fixture();
  t.after(() => rmSync(paths.directory, { recursive: true, force: true }));
  writeFileSync(paths.outputPath, '{}\n');

  const result = run(
    ['--check', '--catalog', paths.catalogPath, '--output', paths.outputPath],
    paths.directory,
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Runtime database is stale/);
});

test('write mode creates runtime data and check mode then passes', (t) => {
  const paths = fixture();
  t.after(() => rmSync(paths.directory, { recursive: true, force: true }));

  const writeResult = run(
    ['--write', '--catalog', paths.catalogPath, '--output', paths.outputPath],
    paths.directory,
  );
  assert.equal(writeResult.status, 0);

  const runtime = JSON.parse(readFileSync(paths.outputPath, 'utf8'));
  assert.equal(runtime.schema_version, 2);
  assert.equal(runtime.DB.length, 1);
  assert.equal(runtime.DB[0].wheel_front_in, 20);
  assert.equal(runtime.DB[0].wheel_rear_in, 26);
  assert.equal(runtime.DB[0].max_rider_kg, 140);
  assert.equal(runtime.DB[0].max_system_kg, 180);
  assert.equal(runtime.DB[0].max_rack_kg, 25);

  const checkResult = run(
    ['--check', '--catalog', paths.catalogPath, '--output', paths.outputPath],
    paths.directory,
  );
  assert.equal(checkResult.status, 0);
});

test('invalid catalog does not overwrite an existing runtime database', (t) => {
  const paths = fixture();
  t.after(() => rmSync(paths.directory, { recursive: true, force: true }));
  writeFileSync(paths.outputPath, 'keep-me\n');
  const invalid = structuredClone(catalog);
  invalid.MODELS[0].limits.rider_kg = 0;
  writeFileSync(paths.catalogPath, `${JSON.stringify(invalid, null, 2)}\n`);

  const result = run(
    ['--write', '--catalog', paths.catalogPath, '--output', paths.outputPath],
    paths.directory,
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /limits\.rider_kg must be null or a positive number/);
  assert.equal(readFileSync(paths.outputPath, 'utf8'), 'keep-me\n');
});

test('write mode refuses to overwrite the canonical catalog', (t) => {
  const paths = fixture();
  t.after(() => rmSync(paths.directory, { recursive: true, force: true }));
  const before = readFileSync(paths.catalogPath, 'utf8');

  const result = run(
    ['--write', '--catalog', paths.catalogPath, '--output', paths.catalogPath],
    paths.directory,
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Output path must not overwrite the catalog/);
  assert.equal(readFileSync(paths.catalogPath, 'utf8'), before);
});
