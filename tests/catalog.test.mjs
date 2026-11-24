import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildRuntimeDatabase,
  legacyRowsSha256,
  migrateLegacyDatabase,
  validateCatalog,
} from '../tools/lib/catalog.mjs';

const legacyDatabase = {
  CONFIG: { version: '1.2', author: 'MBFeniks' },
  COLLAB: { Azub: 'yes' },
  DB: [
    {
      p: 'Azub',
      m: 'Azub 5',
      type: 'bike',
      kg: 135,
      url: 'https://azub.eu/',
      arch: true,
    },
    {
      p: 'Alligt',
      m: 'Alleweder A7',
      type: 'velomobile',
      kg: 0,
      url: 'https://www.alligt.nl/en/alleweder-a7/',
      check: true,
    },
  ],
};

test('migration preserves legacy load without guessing rider or system limits', () => {
  const catalog = migrateLegacyDatabase(legacyDatabase);

  assert.equal(catalog.schema_version, 2);
  assert.equal(catalog.MODELS.length, 2);
  const model = catalog.MODELS.find((entry) => entry.name === 'Azub 5');
  assert.equal(model.id, 'azub--azub-5');
  assert.equal(model.producer_id, 'azub');
  assert.equal(model.status, 'archived');
  assert.equal(model.verification_status, 'legacy_unverified');
  assert.equal(model.legacy_load_kg, 135);
  assert.deepEqual(model.wheels, { front_in: null, rear_in: null });
  assert.deepEqual(model.limits, {
    rider_kg: null,
    system_kg: null,
    rack_kg: null,
  });
  assert.equal(model.curb_weight_kg, null);
  assert.deepEqual(model.sources, [
    {
      url: 'https://azub.eu/',
      kind: 'unclassified',
      retrieved_at: null,
      quote: null,
    },
  ]);
});

test('migration converts legacy zero load and check flag to explicit unknown states', () => {
  const catalog = migrateLegacyDatabase(legacyDatabase);
  const model = catalog.MODELS.find((entry) => entry.name === 'Alleweder A7');

  assert.equal(model.legacy_load_kg, null);
  assert.equal(model.status, 'unknown');
  assert.equal(model.verification_status, 'needs_review');
  assert.equal(model.limits.rider_kg, null);
  assert.equal(model.limits.system_kg, null);
  assert.equal(model.limits.rack_kg, null);
});

test('migration rejects duplicate producer and model names instead of dropping a record', () => {
  const duplicate = structuredClone(legacyDatabase);
  duplicate.DB.push({ ...duplicate.DB[0] });

  assert.throws(
    () => migrateLegacyDatabase(duplicate),
    /Duplicate producer\/model key: Azub\/Azub 5/,
  );
});

test('validation accepts unknown technical values but rejects impossible limits', () => {
  const catalog = migrateLegacyDatabase(legacyDatabase);
  assert.deepEqual(validateCatalog(catalog), []);

  catalog.MODELS[0].limits.rider_kg = 150;
  catalog.MODELS[0].limits.system_kg = 140;

  assert.ok(
    validateCatalog(catalog).some((error) =>
      error.includes('rider_kg cannot exceed system_kg'),
    ),
  );
});

test('validation requires evidence before a model can be marked verified', () => {
  const catalog = migrateLegacyDatabase(legacyDatabase);
  catalog.MODELS[0].verification_status = 'verified';
  catalog.MODELS[0].sources = [];

  assert.ok(
    validateCatalog(catalog).some((error) =>
      error.includes('verified model requires at least one source'),
    ),
  );
});

test('validation rejects zero for known-mass fields because zero means unknown in legacy data', () => {
  const catalog = migrateLegacyDatabase(legacyDatabase);
  catalog.MODELS[0].limits.rider_kg = 0;

  assert.ok(
    validateCatalog(catalog).some((error) =>
      error.includes('limits.rider_kg must be null or a positive number'),
    ),
  );
});

test('runtime build exposes essential fields and keeps missing values null', () => {
  const runtime = buildRuntimeDatabase(migrateLegacyDatabase(legacyDatabase));
  const model = runtime.DB.find((entry) => entry.m === 'Azub 5');

  assert.equal(runtime.schema_version, 2);
  assert.equal(model.id, 'azub--azub-5');
  assert.equal(model.producer_id, 'azub');
  assert.equal(model.p, 'Azub');
  assert.equal(model.m, 'Azub 5');
  assert.equal(model.wheel_front_in, null);
  assert.equal(model.wheel_rear_in, null);
  assert.equal(model.curb_weight_kg, null);
  assert.equal(model.max_rider_kg, null);
  assert.equal(model.max_system_kg, null);
  assert.equal(model.max_rack_kg, null);
  assert.equal(model.legacy_load_kg, 135);
  assert.equal(model.verification_status, 'legacy_unverified');
  assert.equal('MODELS' in runtime, false);
  assert.equal('PRODUCERS' in runtime, false);
});

test('runtime build sorts models by producer and model name', () => {
  const runtime = buildRuntimeDatabase(migrateLegacyDatabase(legacyDatabase));

  assert.deepEqual(
    runtime.DB.map((entry) => `${entry.p}/${entry.m}`),
    ['Alligt/Alleweder A7', 'Azub/Azub 5'],
  );
});

test('verified models require a dated, classified source with evidence text', () => {
  const catalog = migrateLegacyDatabase(legacyDatabase);
  const model = catalog.MODELS.find((entry) => entry.name === 'Azub 5');
  model.verification_status = 'verified';
  model.sources = [
    {
      url: 'https://azub.eu/',
      kind: 'unclassified',
      retrieved_at: null,
      quote: null,
    },
  ];

  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('verified source requires a quote')));
  assert.ok(errors.some((error) => error.includes('verified source requires retrieved_at')));
  assert.ok(errors.some((error) => error.includes('verified source requires a classified kind')));
});

test('validation rejects conflicting lifecycle and verification flags', () => {
  const catalog = migrateLegacyDatabase(legacyDatabase);
  const model = catalog.MODELS.find((entry) => entry.name === 'Azub 5');
  model.status = 'current';
  model.arch = true;
  model.verification_status = 'verified';
  model.check = true;

  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('arch must match status')));
  assert.ok(errors.some((error) => error.includes('check must match verification_status')));
});

test('validation rejects malformed source dates', () => {
  const catalog = migrateLegacyDatabase(legacyDatabase);
  catalog.MODELS[0].sources[0].retrieved_at = 'yesterday';

  assert.ok(
    validateCatalog(catalog).some((error) =>
      error.includes('retrieved_at must be null or an ISO date'),
    ),
  );
});

test('validation reports malformed top-level arrays instead of throwing', () => {
  const catalog = migrateLegacyDatabase(legacyDatabase);
  catalog.PRODUCERS = {};
  catalog.MODELS = {};

  const errors = validateCatalog(catalog);
  assert.ok(errors.includes('PRODUCERS must be an array'));
  assert.ok(errors.includes('MODELS must be an array'));
});

test('catalog preserves the complete legacy migration baseline', () => {
  const catalog = JSON.parse(
    fs.readFileSync(new URL('../data/catalog.json', import.meta.url), 'utf8'),
  );
  const manifest = JSON.parse(
    fs.readFileSync(new URL('../data/migration-manifest.json', import.meta.url), 'utf8'),
  );
  const report = JSON.parse(
    fs.readFileSync(new URL('../data/reconciliation.json', import.meta.url), 'utf8'),
  );

  assert.ok(catalog.MODELS.length >= manifest.legacy_records);
  assert.equal(legacyRowsSha256(catalog), manifest.legacy_rows_sha256);
  assert.equal(new Set(catalog.MODELS.map((model) => model.id)).size, catalog.MODELS.length);
  assert.equal(report.summary.catalog_models, catalog.MODELS.length);
  assert.deepEqual(validateCatalog(catalog), []);
});

test('producer metadata and collaboration keys must stay consistent', () => {
  const catalog = migrateLegacyDatabase(legacyDatabase);
  delete catalog.PRODUCERS.find((producer) => producer.id === 'azub').aliases;
  catalog.COLLAB.Unknown = 'yes';

  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('Producer azub requires aliases')));
  assert.ok(errors.some((error) => error.includes('COLLAB references unknown producer')));
});

test('verified evidence must be complete in one source', () => {
  const catalog = migrateLegacyDatabase(legacyDatabase);
  const model = catalog.MODELS.find((entry) => entry.name === 'Azub 5');
  model.verification_status = 'verified';
  model.sources = [
    { url: 'https://azub.eu/quote', kind: 'official', retrieved_at: null, quote: 'Load limit' },
    { url: 'https://azub.eu/date', kind: 'official', retrieved_at: '2026-11-24', quote: null },
    { url: 'https://azub.eu/kind', kind: 'unclassified', retrieved_at: '2026-11-24', quote: 'Load limit' },
  ];

  assert.ok(
    validateCatalog(catalog).some((error) =>
      error.includes('verified model requires one complete source'),
    ),
  );
});

test('validation rejects impossible calendar dates', () => {
  const catalog = migrateLegacyDatabase(legacyDatabase);
  catalog.MODELS[0].sources[0].retrieved_at = '2026-02-31';

  assert.ok(
    validateCatalog(catalog).some((error) =>
      error.includes('retrieved_at must be null or an ISO date'),
    ),
  );
});
