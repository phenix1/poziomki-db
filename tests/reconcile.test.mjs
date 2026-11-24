import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateLegacyDatabase } from '../tools/lib/catalog.mjs';
import { reconcileCatalog } from '../tools/lib/reconcile.mjs';

const legacy = {
  CONFIG: { version: '1.2' },
  COLLAB: {},
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
      p: 'Flevobike',
      m: 'Greenmachine',
      type: 'velomobile',
      kg: 0,
      url: 'https://example.com/greenmachine',
      arch: true,
    },
  ],
};

const producerFiles = [
  {
    filename: 'Azub.json',
    models: [
      {
        p: 'Azub',
        m: 'Azub 5',
        type: 'bike',
        kg: 140,
        url: 'https://azub.eu/',
        arch: true,
      },
    ],
  },
  {
    filename: 'Avatar 2000.json',
    models: [
      {
        p: 'Avatar 2000',
        m: 'Avatar 2000',
        type: 'bike',
        kg: 0,
        url: 'https://example.com/avatar',
        arch: true,
      },
    ],
  },
  {
    filename: 'Flevobike.json',
    models: [
      {
        p: 'Flevobike',
        m: 'GreenMachine',
        type: 'velomobile',
        kg: 0,
        url: 'https://example.com/greenmachine',
        arch: true,
      },
    ],
  },
];

test('reconciliation reports missing, changed and alias candidates without merging them', () => {
  const report = reconcileCatalog(migrateLegacyDatabase(legacy), producerFiles);

  assert.equal(report.schema_version, 1);
  assert.deepEqual(report.summary, {
    catalog_models: 2,
    producer_models: 3,
    missing_from_catalog: 2,
    missing_from_producers: 1,
    changed_common_models: 1,
    duplicate_producer_keys: 0,
    possible_aliases: 1,
  });
  assert.deepEqual(report.missing_from_catalog, [
    { p: 'Avatar 2000', m: 'Avatar 2000' },
    { p: 'Flevobike', m: 'GreenMachine' },
  ]);
  assert.deepEqual(report.missing_from_producers, [
    { p: 'Flevobike', m: 'Greenmachine' },
  ]);
  assert.deepEqual(report.changed_common_models, [
    {
      p: 'Azub',
      m: 'Azub 5',
      changed_fields: ['kg'],
    },
  ]);
  assert.deepEqual(report.possible_aliases, [
    {
      producer_model: { p: 'Flevobike', m: 'GreenMachine' },
      catalog_model: { p: 'Flevobike', m: 'Greenmachine' },
    },
  ]);
});

test('reconciliation exposes duplicate producer keys instead of silently keeping one', () => {
  const duplicateFiles = [
    ...producerFiles,
    {
      filename: 'Azub-copy.json',
      models: [{ ...producerFiles[0].models[0] }],
    },
  ];

  const report = reconcileCatalog(migrateLegacyDatabase(legacy), duplicateFiles);

  assert.equal(report.summary.duplicate_producer_keys, 1);
  assert.deepEqual(report.duplicate_producer_keys, [
    {
      p: 'Azub',
      m: 'Azub 5',
      occurrences: [
        { filename: 'Azub-copy.json', index: 0 },
        { filename: 'Azub.json', index: 0 },
      ],
    },
  ]);
});
