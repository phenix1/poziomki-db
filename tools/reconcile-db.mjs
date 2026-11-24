import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { validateCatalog } from './lib/catalog.mjs';
import { reconcileCatalog } from './lib/reconcile.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

function usage() {
  return [
    'Usage: node tools/reconcile-db.mjs [--check|--write] [--catalog PATH] [--producers DIR] [--output PATH]',
    '',
    '  --check     Compare reconciliation report (default)',
    '  --write     Write reconciliation report',
    '  --catalog   Canonical catalog path (default: data/catalog.json)',
    '  --producers Producer JSON directory (default: producers)',
    '  --output    Report path (default: data/reconciliation.json)',
  ].join('\n');
}

function parseArgs(args) {
  const options = {
    mode: 'check',
    catalogPath: path.join(root, 'data/catalog.json'),
    producersPath: path.join(root, 'producers'),
    outputPath: path.join(root, 'data/reconciliation.json'),
  };
  let modeSelected = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--check' || arg === '--write') {
      if (modeSelected) throw new Error('Choose only one of --check or --write');
      options.mode = arg === '--write' ? 'write' : 'check';
      modeSelected = true;
      continue;
    }
    if (['--catalog', '--producers', '--output'].includes(arg)) {
      const value = args[index + 1];
      if (!value) throw new Error(`${arg} requires a path`);
      if (arg === '--catalog') options.catalogPath = value;
      if (arg === '--producers') options.producersPath = value;
      if (arg === '--output') options.outputPath = value;
      index += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const catalogPath = path.resolve(options.catalogPath);
  const producersPath = path.resolve(options.producersPath);
  const outputPath = path.resolve(options.outputPath);
  const realCatalogPath = fs.realpathSync(catalogPath);
  const realProducersPath = fs.realpathSync(producersPath);
  const realOutputPath = fs.existsSync(outputPath)
    ? fs.realpathSync(outputPath)
    : outputPath;
  if (realOutputPath === realCatalogPath) {
    throw new Error('Report output must not overwrite the catalog');
  }
  const relativeOutput = path.relative(realProducersPath, realOutputPath);
  if (relativeOutput === '' || (!relativeOutput.startsWith('..') && !path.isAbsolute(relativeOutput))) {
    throw new Error('Report output must be outside the producers directory');
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const errors = validateCatalog(catalog);
  if (errors.length > 0) {
    throw new Error(`Invalid catalog:\n${errors.join('\n')}`);
  }

  const producerFiles = fs
    .readdirSync(producersPath)
    .filter((filename) => filename.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((filename) => ({
      filename,
      models: JSON.parse(
        fs.readFileSync(path.join(producersPath, filename), 'utf8'),
      ),
    }));

  const report = reconcileCatalog(catalog, producerFiles);
  const serialized = `${JSON.stringify(report, null, 2)}\n`;

  if (options.mode === 'write') {
    const temporaryPath = `${outputPath}.tmp-${process.pid}`;
    try {
      fs.writeFileSync(temporaryPath, serialized);
      fs.renameSync(temporaryPath, outputPath);
    } finally {
      if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    }
    console.log(`Wrote reconciliation report to ${outputPath}`);
  } else {
    const current = fs.existsSync(outputPath)
      ? fs.readFileSync(outputPath, 'utf8')
      : null;
    if (current !== serialized) {
      console.error(
        'Reconciliation report is stale. Run: node tools/reconcile-db.mjs --write',
      );
      process.exit(1);
    }
    console.log('Reconciliation report is current');
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
