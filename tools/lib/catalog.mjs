import crypto from 'node:crypto';

const VEHICLE_TYPES = new Set([
  'tadpole',
  'delta',
  'bike',
  'quad',
  'velomobile',
  'handcycle',
]);

const MODEL_STATUSES = new Set(['current', 'archived', 'unknown']);
const VERIFICATION_STATUSES = new Set([
  'verified',
  'needs_review',
  'legacy_unverified',
  'conflict',
]);
const SOURCE_KINDS = new Set([
  'official',
  'manual',
  'archive',
  'community',
  'unclassified',
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function requireBoolean(value, field, errors, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') {
    errors.push(`${field} must be a boolean`);
    return fallback;
  }
  return value;
}

export function migrateLegacyDatabase(legacy) {
  if (!isObject(legacy) || !Array.isArray(legacy.DB)) {
    throw new Error('Legacy database must contain a DB array');
  }

  const errors = [];
  const models = [];
  const modelKeys = new Set();
  const modelIds = new Set();
  const producerNames = new Set(Object.keys(legacy.COLLAB || {}));

  for (const row of legacy.DB) {
    if (!isObject(row)) {
      errors.push('Legacy DB entries must be objects');
      continue;
    }
    if (typeof row.p !== 'string' || !row.p.trim()) {
      errors.push('Legacy DB entry requires p');
      continue;
    }
    if (typeof row.m !== 'string' || !row.m.trim()) {
      errors.push(`Legacy DB entry ${row.p} requires m`);
      continue;
    }
    if (!VEHICLE_TYPES.has(row.type)) {
      errors.push(`${row.p}/${row.m} has invalid type: ${row.type}`);
      continue;
    }
    if (!isHttpUrl(row.url)) {
      errors.push(`${row.p}/${row.m} has invalid url`);
      continue;
    }

    const key = `${row.p}|${row.m}`;
    if (modelKeys.has(key)) {
      throw new Error(`Duplicate producer/model key: ${row.p}/${row.m}`);
    }
    modelKeys.add(key);

    const producerId = slugify(row.p);
    const modelId = `${producerId}--${slugify(row.m)}`;
    if (!producerId || modelIds.has(modelId)) {
      throw new Error(`Duplicate or empty model id: ${row.p}/${row.m}`);
    }
    modelIds.add(modelId);
    producerNames.add(row.p);

    let legacyLoadKg = null;
    if (row.kg !== undefined && row.kg !== null) {
      if (typeof row.kg !== 'number' || !Number.isFinite(row.kg) || row.kg < 0) {
        errors.push(`${row.p}/${row.m} has invalid kg`);
      } else if (row.kg > 0) {
        legacyLoadKg = row.kg;
      }
    }

    const arch = requireBoolean(row.arch, `${row.p}/${row.m}.arch`, errors);
    const offroad = requireBoolean(
      row.offroad,
      `${row.p}/${row.m}.offroad`,
      errors,
    );
    const check = requireBoolean(row.check, `${row.p}/${row.m}.check`, errors);

    models.push({
      id: modelId,
      producer_id: producerId,
      name: row.m,
      type: row.type,
      status: arch ? 'archived' : 'unknown',
      verification_status: check ? 'needs_review' : 'legacy_unverified',
      wheels: { front_in: null, rear_in: null },
      curb_weight_kg: null,
      limits: {
        rider_kg: null,
        system_kg: null,
        rack_kg: null,
      },
      legacy_load_kg: legacyLoadKg,
      url: row.url,
      arch,
      offroad,
      check,
      sources: [
        {
          url: row.url,
          kind: 'unclassified',
          retrieved_at: null,
          quote: null,
        },
      ],
    });
  }

  if (errors.length > 0) {
    throw new Error(`Invalid legacy database:\n${errors.join('\n')}`);
  }

  const producers = [...producerNames]
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((name) => ({
      id: slugify(name),
      name,
      collaboration_status: legacy.COLLAB?.[name] || 'unknown',
      official_url: null,
      country_code: null,
      aliases: [],
    }));

  const producerIds = new Set();
  for (const producer of producers) {
    if (!producer.id || producerIds.has(producer.id)) {
      throw new Error(`Duplicate or empty producer id: ${producer.name}`);
    }
    producerIds.add(producer.id);
  }

  models.sort((a, b) => {
    const producerA = producers.find((entry) => entry.id === a.producer_id)?.name;
    const producerB = producers.find((entry) => entry.id === b.producer_id)?.name;
    return producerA.localeCompare(producerB, 'en') || a.name.localeCompare(b.name, 'en');
  });

  return {
    schema_version: 2,
    CONFIG: structuredClone(legacy.CONFIG || {}),
    COLLAB: structuredClone(legacy.COLLAB || {}),
    PRODUCERS: producers,
    MODELS: models,
  };
}

function isIsoDate(value) {
  if (value === null) return true;
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }
  return value.length === 10 || !Number.isNaN(Date.parse(value));
}

export function legacyRowsSha256(catalog) {
  const producers = new Map(
    catalog.PRODUCERS.map((producer) => [producer.id, producer.name]),
  );
  const rows = catalog.MODELS.map((model) => ({
    p: producers.get(model.producer_id),
    m: model.name,
    type: model.type,
    kg: model.legacy_load_kg ?? 0,
    url: model.url,
    arch: model.arch,
    offroad: model.offroad,
    check: model.check,
  }));
  rows.sort((a, b) => {
    if (a.p !== b.p) return a.p < b.p ? -1 : 1;
    if (a.m !== b.m) return a.m < b.m ? -1 : 1;
    return 0;
  });
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(rows))
    .digest('hex');
}

export function validateCatalog(catalog) {
  const errors = [];
  if (!isObject(catalog)) return ['Catalog must be an object'];
  if (catalog.schema_version !== 2) errors.push('schema_version must be 2');
  if (!isObject(catalog.CONFIG)) errors.push('CONFIG must be an object');
  if (!isObject(catalog.COLLAB)) errors.push('COLLAB must be an object');
  if (!Array.isArray(catalog.PRODUCERS)) errors.push('PRODUCERS must be an array');
  if (!Array.isArray(catalog.MODELS)) errors.push('MODELS must be an array');

  const producers = Array.isArray(catalog.PRODUCERS) ? catalog.PRODUCERS : [];
  const models = Array.isArray(catalog.MODELS) ? catalog.MODELS : [];
  const producerIds = new Set();
  for (const producer of producers) {
    if (!isObject(producer) || typeof producer.id !== 'string' || !producer.id) {
      errors.push('Producer requires a non-empty id');
      continue;
    }
    if (producerIds.has(producer.id)) {
      errors.push(`Duplicate producer id: ${producer.id}`);
    }
    producerIds.add(producer.id);
    if (typeof producer.name !== 'string' || !producer.name.trim()) {
      errors.push(`Producer ${producer.id} requires a name`);
    }
    if (typeof producer.collaboration_status !== 'string') {
      errors.push(`Producer ${producer.id} requires collaboration_status`);
    }
    if (producer.official_url !== null && !isHttpUrl(producer.official_url)) {
      errors.push(`Producer ${producer.id} has invalid official_url`);
    }
    if (producer.country_code !== null && typeof producer.country_code !== 'string') {
      errors.push(`Producer ${producer.id} has invalid country_code`);
    }
    if (!Array.isArray(producer.aliases) || producer.aliases.some((alias) => typeof alias !== 'string')) {
      errors.push(`Producer ${producer.id} requires aliases`);
    }
    const expectedCollaboration = catalog.COLLAB?.[producer.name] || 'unknown';
    if (producer.collaboration_status !== expectedCollaboration) {
      errors.push(`Producer ${producer.id} collaboration_status must match COLLAB`);
    }
  }

  const producerNames = new Set(producers.map((producer) => producer?.name));
  for (const name of Object.keys(catalog.COLLAB || {})) {
    if (!producerNames.has(name)) {
      errors.push(`COLLAB references unknown producer: ${name}`);
    }
  }

  const modelIds = new Set();
  const modelKeys = new Set();
  for (const model of models) {
    const label = model?.id || model?.name || 'unknown model';
    if (!isObject(model)) {
      errors.push('Model must be an object');
      continue;
    }
    if (typeof model.id !== 'string' || !model.id) {
      errors.push(`${label} requires a non-empty id`);
    }
    if (modelIds.has(model.id)) errors.push(`Duplicate model id: ${model.id}`);
    modelIds.add(model.id);
    if (!producerIds.has(model.producer_id)) {
      errors.push(`${label} references unknown producer_id: ${model.producer_id}`);
    }
    if (typeof model.name !== 'string' || !model.name.trim()) {
      errors.push(`${label} requires a name`);
    }
    const modelKey = `${model.producer_id}|${model.name}`;
    if (modelKeys.has(modelKey)) errors.push(`Duplicate producer/model: ${modelKey}`);
    modelKeys.add(modelKey);
    if (!VEHICLE_TYPES.has(model.type)) errors.push(`${label} has invalid type`);
    if (!MODEL_STATUSES.has(model.status)) errors.push(`${label} has invalid status`);
    if (!VERIFICATION_STATUSES.has(model.verification_status)) {
      errors.push(`${label} has invalid verification_status`);
    }
    if (!isHttpUrl(model.url)) errors.push(`${label} has invalid url`);

    for (const field of ['arch', 'offroad', 'check']) {
      if (typeof model[field] !== 'boolean') errors.push(`${label}.${field} must be a boolean`);
    }
    if (model.status === 'archived' && model.arch !== true) {
      errors.push(`${label}: arch must match status`);
    }
    if (model.status !== 'archived' && model.arch !== false) {
      errors.push(`${label}: arch must match status`);
    }
    const expectedCheck = model.verification_status === 'needs_review' || model.verification_status === 'conflict';
    if (model.check !== expectedCheck) {
      errors.push(`${label}: check must match verification_status`);
    }

    if (!isObject(model.wheels)) {
      errors.push(`${label}.wheels must be an object`);
    } else {
      for (const field of ['front_in', 'rear_in']) {
        const value = model.wheels[field];
        if (value !== null && !isPositiveNumber(value)) {
          errors.push(`${label}.wheels.${field} must be null or a positive number`);
        }
      }
    }

    if (model.curb_weight_kg !== null && !isPositiveNumber(model.curb_weight_kg)) {
      errors.push(`${label}.curb_weight_kg must be null or a positive number`);
    }
    if (model.legacy_load_kg !== null && !isPositiveNumber(model.legacy_load_kg)) {
      errors.push(`${label}.legacy_load_kg must be null or a positive number`);
    }

    if (!isObject(model.limits)) {
      errors.push(`${label}.limits must be an object`);
    } else {
      for (const field of ['rider_kg', 'system_kg', 'rack_kg']) {
        const value = model.limits[field];
        if (value !== null && !isPositiveNumber(value)) {
          errors.push(`${label}.limits.${field} must be null or a positive number`);
        }
      }
      if (
        isPositiveNumber(model.limits.rider_kg) &&
        isPositiveNumber(model.limits.system_kg) &&
        model.limits.rider_kg > model.limits.system_kg
      ) {
        errors.push(`${label}: limits.rider_kg cannot exceed system_kg`);
      }
    }

    if (!Array.isArray(model.sources)) {
      errors.push(`${label}.sources must be an array`);
    } else {
      if (model.verification_status === 'verified') {
        if (model.sources.length === 0) {
          errors.push(`${label}: verified model requires at least one source`);
        }
        if (!model.sources.some((source) => typeof source?.quote === 'string' && source.quote.trim())) {
          errors.push(`${label}: verified source requires a quote`);
        }
        if (!model.sources.some((source) => isIsoDate(source?.retrieved_at) && source.retrieved_at !== null)) {
          errors.push(`${label}: verified source requires retrieved_at`);
        }
        if (!model.sources.some((source) => SOURCE_KINDS.has(source?.kind) && source.kind !== 'unclassified')) {
          errors.push(`${label}: verified source requires a classified kind`);
        }
        const completeEvidence = (source) => isObject(source)
          && isHttpUrl(source.url)
          && SOURCE_KINDS.has(source.kind)
          && source.kind !== 'unclassified'
          && typeof source.quote === 'string'
          && source.quote.trim().length > 0
          && source.retrieved_at !== null
          && isIsoDate(source.retrieved_at);
        if (!model.sources.some(completeEvidence)) {
          errors.push(`${label}: verified model requires one complete source`);
        }
      }
      for (const source of model.sources) {
        if (!isObject(source) || !isHttpUrl(source.url)) {
          errors.push(`${label} has an invalid source`);
          continue;
        }
        if (!SOURCE_KINDS.has(source.kind)) {
          errors.push(`${label} source has invalid kind: ${source.kind}`);
        }
        if (!isIsoDate(source.retrieved_at)) {
          errors.push(`${label} source retrieved_at must be null or an ISO date`);
        }
        if (source.quote !== null && typeof source.quote !== 'string') {
          errors.push(`${label} source quote must be null or a string`);
        }
      }
    }
  }

  return errors;
}

export function buildRuntimeDatabase(catalog) {
  const errors = validateCatalog(catalog);
  if (errors.length > 0) {
    throw new Error(`Invalid catalog:\n${errors.join('\n')}`);
  }

  const producers = new Map(catalog.PRODUCERS.map((producer) => [producer.id, producer]));
  const models = catalog.MODELS.map((model) => ({
    id: model.id,
    producer_id: model.producer_id,
    p: producers.get(model.producer_id).name,
    m: model.name,
    type: model.type,
    status: model.status,
    verification_status: model.verification_status,
    wheel_front_in: model.wheels.front_in,
    wheel_rear_in: model.wheels.rear_in,
    curb_weight_kg: model.curb_weight_kg,
    max_rider_kg: model.limits.rider_kg,
    max_system_kg: model.limits.system_kg,
    max_rack_kg: model.limits.rack_kg,
    legacy_load_kg: model.legacy_load_kg,
    url: model.url,
    arch: model.status === 'archived',
    offroad: model.offroad,
    check: model.verification_status === 'needs_review' || model.verification_status === 'conflict',
    sources: model.sources,
  }));

  models.sort(
    (a, b) => a.p.localeCompare(b.p, 'en') || a.m.localeCompare(b.m, 'en'),
  );

  return {
    schema_version: 2,
    CONFIG: structuredClone(catalog.CONFIG || {}),
    COLLAB: structuredClone(catalog.COLLAB || {}),
    DB: models,
  };
}
