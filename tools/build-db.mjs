import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildRuntimeDatabase } from './lib/catalog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

function usage() {
  return [
    'Usage: node tools/build-db.mjs [--check|--write] [--catalog PATH] [--output PATH]',
    '',
    '  --check     Validate catalog and compare runtime output (default)',
    '  --write     Validate catalog and write runtime output',
    '  --catalog   Canonical catalog path (default: data/catalog.json)',
    '  --output    Runtime output path (default: data/db.json)',
  ].join('\n');
}

function parseArgs(args) {
  const options = {
    mode: 'check',
    catalogPath: path.join(root, 'data/catalog.json'),
    outputPath: path.join(root, 'data/db.json'),
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
    if (arg === '--catalog' || arg === '--output') {
      const value = args[index + 1];
      if (!value) throw new Error(`${arg} requires a path`);
      if (arg === '--catalog') options.catalogPath = value;
      else options.outputPath = value;
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
  const outputPath = path.resolve(options.outputPath);
  const realCatalogPath = fs.realpathSync(catalogPath);
  const realOutputPath = fs.existsSync(outputPath)
    ? fs.realpathSync(outputPath)
    : outputPath;
  if (realOutputPath === realCatalogPath) {
    throw new Error('Output path must not overwrite the catalog');
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const runtime = buildRuntimeDatabase(catalog);
  const serialized = `${JSON.stringify(runtime, null, 2)}\n`;

  if (options.mode === 'write') {
    const temporaryPath = `${outputPath}.tmp-${process.pid}`;
    try {
      fs.writeFileSync(temporaryPath, serialized);
      fs.renameSync(temporaryPath, outputPath);
    } finally {
      if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    }
    console.log(`Wrote ${runtime.DB.length} models to ${outputPath}`);
  } else {
    const current = fs.existsSync(outputPath)
      ? fs.readFileSync(outputPath, 'utf8')
      : null;
    if (current !== serialized) {
      console.error(
        'Runtime database is stale. Run: node tools/build-db.mjs --write',
      );
      process.exit(1);
    }
    console.log(`Runtime database is current: ${runtime.DB.length} models`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
