import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(
  new URL('../tools/reconcile-db.mjs', import.meta.url),
);

const catalog = {
  schema_version: 2,
  CONFIG: {},
  COLLAB: {},
  PRODUCERS: [
    {
      id: 'azub',
      name: 'Azub',
      collaboration_status: 'unknown',
      official_url: null,
      country_code: null,
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
      wheels: { front_in: null, rear_in: null },
      curb_weight_kg: null,
      limits: { rider_kg: null, system_kg: null, rack_kg: null },
      legacy_load_kg: 135,
      url: 'https://azub.eu/',
      arch: true,
      offroad: false,
      check: false,
      sources: [],
    },
  ],
};

const producerRows = [
  {
    p: 'Azub',
    m: 'Azub 5',
    type: 'bike',
    kg: 140,
    url: 'https://azub.eu/',
    arch: true,
  },
  {
    p: 'Avatar 2000',
    m: 'Avatar 2000',
    type: 'bike',
    kg: 0,
    url: 'https://example.com/avatar',
    arch: true,
  },
];

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'poziomki-reconcile-'));
  const catalogPath = join(directory, 'catalog.json');
  const producersPath = join(directory, 'producers');
  const outputPath = join(directory, 'reconciliation.json');
  mkdirSync(producersPath);
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  writeFileSync(
    join(producersPath, 'Azub.json'),
    `${JSON.stringify([producerRows[0]], null, 2)}\n`,
  );
  writeFileSync(
    join(producersPath, 'Avatar 2000.json'),
    `${JSON.stringify([producerRows[1]], null, 2)}\n`,
  );
  return { directory, catalogPath, producersPath, outputPath };
}

function run(args, directory) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: directory,
    encoding: 'utf8',
  });
}

test('check mode fails when reconciliation report is missing', (t) => {
  const paths = fixture();
  t.after(() => rmSync(paths.directory, { recursive: true, force: true }));

  const result = run(
    [
      '--check',
      '--catalog',
      paths.catalogPath,
      '--producers',
      paths.producersPath,
      '--output',
      paths.outputPath,
    ],
    paths.directory,
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Reconciliation report is stale/);
});

test('write mode creates a deterministic report and check mode passes', (t) => {
  const paths = fixture();
  t.after(() => rmSync(paths.directory, { recursive: true, force: true }));

  const writeResult = run(
    [
      '--write',
      '--catalog',
      paths.catalogPath,
      '--producers',
      paths.producersPath,
      '--output',
      paths.outputPath,
    ],
    paths.directory,
  );
  assert.equal(writeResult.status, 0);

  const report = JSON.parse(readFileSync(paths.outputPath, 'utf8'));
  assert.equal(report.summary.catalog_models, 1);
  assert.equal(report.summary.producer_models, 2);
  assert.equal(report.summary.missing_from_catalog, 1);
  assert.equal(report.summary.changed_common_models, 1);

  const checkResult = run(
    [
      '--check',
      '--catalog',
      paths.catalogPath,
      '--producers',
      paths.producersPath,
      '--output',
      paths.outputPath,
    ],
    paths.directory,
  );
  assert.equal(checkResult.status, 0);
});

test('write mode refuses to place the report inside the producer directory', (t) => {
  const paths = fixture();
  t.after(() => rmSync(paths.directory, { recursive: true, force: true }));
  const outputPath = join(paths.producersPath, 'report.json');

  const result = run(
    [
      '--write',
      '--catalog',
      paths.catalogPath,
      '--producers',
      paths.producersPath,
      '--output',
      outputPath,
    ],
    paths.directory,
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Report output must be outside the producers directory/);
});
