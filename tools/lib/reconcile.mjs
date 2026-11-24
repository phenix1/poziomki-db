const COMPARED_FIELDS = ['type', 'kg', 'url', 'arch', 'offroad', 'check'];

function normalize(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function keyOf(row) {
  return `${row.p}|${row.m}`;
}

function compareKey(a, b) {
  return a.p.localeCompare(b.p, 'en') || a.m.localeCompare(b.m, 'en');
}

function legacyView(model, producers) {
  return {
    p: producers.get(model.producer_id).name,
    m: model.name,
    type: model.type,
    kg: model.legacy_load_kg ?? 0,
    url: model.url,
    arch: model.arch,
    offroad: model.offroad,
    check: model.check,
  };
}

function normalizedLegacyView(row) {
  return {
    ...row,
    type: row.type || '',
    kg: row.kg ?? 0,
    url: row.url || '',
    arch: Boolean(row.arch),
    offroad: Boolean(row.offroad),
    check: Boolean(row.check),
  };
}

export function reconcileCatalog(catalog, producerFiles) {
  const producers = new Map(
    catalog.PRODUCERS.map((producer) => [producer.id, producer]),
  );
  const catalogRows = catalog.MODELS.map((model) => legacyView(model, producers));
  const catalogByKey = new Map(catalogRows.map((row) => [keyOf(row), row]));

  const producerOccurrences = new Map();
  for (const file of producerFiles) {
    if (!Array.isArray(file.models)) continue;
    file.models.forEach((row, index) => {
      const key = keyOf(row);
      const occurrences = producerOccurrences.get(key) || [];
      occurrences.push({ filename: file.filename, index, row });
      producerOccurrences.set(key, occurrences);
    });
  }

  const producerByKey = new Map();
  const duplicateProducerKeys = [];
  for (const [key, occurrences] of producerOccurrences) {
    occurrences.sort(
      (a, b) =>
        a.filename.localeCompare(b.filename, 'en') || a.index - b.index,
    );
    producerByKey.set(key, normalizedLegacyView(occurrences[0].row));
    if (occurrences.length > 1) {
      duplicateProducerKeys.push({
        p: occurrences[0].row.p,
        m: occurrences[0].row.m,
        occurrences: occurrences.map(({ filename, index }) => ({
          filename,
          index,
        })),
      });
    }
  }

  const missingFromCatalog = [...producerByKey.keys()]
    .filter((key) => !catalogByKey.has(key))
    .map((key) => {
      const row = producerByKey.get(key);
      return { p: row.p, m: row.m };
    })
    .sort(compareKey);

  const missingFromProducers = [...catalogByKey.keys()]
    .filter((key) => !producerByKey.has(key))
    .map((key) => {
      const row = catalogByKey.get(key);
      return { p: row.p, m: row.m };
    })
    .sort(compareKey);

  const changedCommonModels = [];
  for (const [key, catalogRow] of catalogByKey) {
    const producerRow = producerByKey.get(key);
    if (!producerRow) continue;
    const changedFields = COMPARED_FIELDS.filter(
      (field) => catalogRow[field] !== producerRow[field],
    );
    if (changedFields.length > 0) {
      changedCommonModels.push({
        p: catalogRow.p,
        m: catalogRow.m,
        changed_fields: changedFields,
      });
    }
  }
  changedCommonModels.sort(compareKey);

  const possibleAliases = [];
  const unmatchedCatalog = missingFromProducers.map((row) => ({
    ...row,
    normalized: `${normalize(row.p)}|${normalize(row.m)}`,
  }));
  for (const producerRow of missingFromCatalog) {
    const normalized = `${normalize(producerRow.p)}|${normalize(producerRow.m)}`;
    const match = unmatchedCatalog.find((row) => row.normalized === normalized);
    if (match) {
      possibleAliases.push({
        producer_model: { p: producerRow.p, m: producerRow.m },
        catalog_model: { p: match.p, m: match.m },
      });
    }
  }
  possibleAliases.sort((a, b) => compareKey(a.producer_model, b.producer_model));
  duplicateProducerKeys.sort(compareKey);

  return {
    schema_version: 1,
    summary: {
      catalog_models: catalogRows.length,
      producer_models: [...producerOccurrences.values()].reduce(
        (total, occurrences) => total + occurrences.length,
        0,
      ),
      missing_from_catalog: missingFromCatalog.length,
      missing_from_producers: missingFromProducers.length,
      changed_common_models: changedCommonModels.length,
      duplicate_producer_keys: duplicateProducerKeys.length,
      possible_aliases: possibleAliases.length,
    },
    missing_from_catalog: missingFromCatalog,
    missing_from_producers: missingFromProducers,
    changed_common_models: changedCommonModels,
    duplicate_producer_keys: duplicateProducerKeys,
    possible_aliases: possibleAliases,
  };
}
