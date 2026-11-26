import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(
  new URL('../dist/poziomki.user.js', import.meta.url),
);
const source = fs.readFileSync(scriptPath, 'utf8');
const instrumented = source.replace(
  /\n\}\)\(\);\s*$/,
  `
globalThis.__poziomkiTest = {
  formatEssentialSpecs: typeof formatEssentialSpecs === 'function' ? formatEssentialSpecs : null,
  getEditLoadValue: typeof getEditLoadValue === 'function' ? getEditLoadValue : null,
  normalizePublicDatabase: typeof normalizePublicDatabase === 'function' ? normalizePublicDatabase : null,
  resolveRuntimeDatabase: typeof resolveRuntimeDatabase === 'function' ? resolveRuntimeDatabase : null,
  renderTable,
  setShadow(value) { shadow = value; },
  setDatabase(value) { DB = value; },
  setState(value) { state = value; },
};
})();
`,
);

function loadClient() {
  const context = {
    console,
    document: {
      readyState: 'loading',
      addEventListener() {},
      body: { appendChild() {} },
      createElement() {
        return {
          style: {},
          attachShadow() {
            return { appendChild() {} };
          },
        };
      },
      getElementById() {
        return null;
      },
    },
    GM_getValue() {
      return {};
    },
    GM_setValue() {},
    GM_xmlhttpRequest() {},
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    URL,
    structuredClone,
  };
  vm.createContext(context);
  vm.runInContext(instrumented, context, { filename: scriptPath });
  return context.__poziomkiTest;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

const model = {
  id: 'azub--azub-5',
  producer_id: 'azub',
  p: 'Azub',
  m: 'Azub 5',
  type: 'bike',
  status: 'archived',
  verification_status: 'legacy_unverified',
  wheel_front_in: 20,
  wheel_rear_in: 26,
  curb_weight_kg: 14.5,
  max_rider_kg: 140,
  max_system_kg: 180,
  max_rack_kg: 25,
  legacy_load_kg: 135,
  url: 'https://azub.eu/',
  arch: true,
  offroad: false,
  check: false,
  sources: [],
};

test('essential formatter shows only known values without verification metadata', () => {
  const client = loadClient();
  assert.equal(typeof client.formatEssentialSpecs, 'function');

  const html = client.formatEssentialSpecs(model);
  assert.match(html, /Front: 20"/);
  assert.match(html, /Rear: 26"/);
  assert.match(html, /Bike: 14\.5 kg/);
  assert.match(html, /Rider: 140 kg/);
  assert.match(html, /System: 180 kg/);
  assert.match(html, /Rack: 25 kg/);
  assert.doesNotMatch(html, /Status:|Evidence:|pdb-unknown/);
});

test('essential formatter omits the subtitle when no values are known', () => {
  const client = loadClient();
  const unknown = {
    ...model,
    wheel_front_in: null,
    wheel_rear_in: null,
    curb_weight_kg: null,
    max_rider_kg: null,
    max_system_kg: null,
    max_rack_kg: null,
  };

  assert.equal(client.formatEssentialSpecs(unknown), '');
});

test('essential formatter omits unsupported fields from partial records', () => {
  const client = loadClient();
  const partial = {
    ...model,
    wheel_front_in: 20,
    wheel_rear_in: null,
    curb_weight_kg: null,
    max_rider_kg: 140,
    max_system_kg: null,
    max_rack_kg: null,
  };

  const html = client.formatEssentialSpecs(partial);
  assert.match(html, /Front: 20"/);
  assert.match(html, /Rider: 140 kg/);
  assert.doesNotMatch(html, /Rear:|Bike:|System:|Rack:|pdb-unknown/);
});

test('main table renders essential values for v2 records', () => {
  const client = loadClient();
  const tbody = {
    innerHTML: '',
    querySelectorAll() {
      return [];
    },
  };
  const elements = {
    'pdb-badge-num': { textContent: '' },
    'pdb-s-p': { textContent: '' },
    'pdb-s-m': { textContent: '' },
    'pdb-s-t': { textContent: '' },
    'pdb-s-k': { textContent: '' },
    'pdb-tbody': tbody,
  };
  client.setShadow({
    getElementById(id) {
      return elements[id] || null;
    },
  });
  client.setDatabase([model]);
  client.setState({
    filterType: 'all',
    filterProd: 'all',
    minKg: 0,
    searchStr: '',
    sortCol: 'p',
    sortDir: 1,
    modProducer: '',
  });

  client.renderTable();

  assert.match(tbody.innerHTML, /pdb-essentials/);
  assert.match(tbody.innerHTML, /Front: 20"/);
  assert.match(tbody.innerHTML, /Rear: 26"/);
  assert.match(tbody.innerHTML, /Rider: 140 kg/);
  assert.doesNotMatch(tbody.innerHTML, /Status:|Evidence:/);
  assert.match(tbody.innerHTML, /135 kg/);
});

test('legacy API records keep the existing table layout', () => {
  const client = loadClient();
  const tbody = {
    innerHTML: '',
    querySelectorAll() {
      return [];
    },
  };
  const elements = {
    'pdb-badge-num': { textContent: '' },
    'pdb-s-p': { textContent: '' },
    'pdb-s-m': { textContent: '' },
    'pdb-s-t': { textContent: '' },
    'pdb-s-k': { textContent: '' },
    'pdb-tbody': tbody,
  };
  client.setShadow({
    getElementById(id) {
      return elements[id] || null;
    },
  });
  client.setDatabase([
    {
      p: 'Azub',
      m: 'Azub 5',
      type: 'bike',
      kg: 135,
      url: 'https://azub.eu/',
      arch: true,
    },
  ]);
  client.setState({
    filterType: 'all',
    filterProd: 'all',
    minKg: 0,
    searchStr: '',
    sortCol: 'p',
    sortDir: 1,
    modProducer: '',
  });

  client.renderTable();

  assert.doesNotMatch(tbody.innerHTML, /pdb-essentials/);
  assert.match(tbody.innerHTML, /135 kg/);
});

test('v2 edit modal preserves legacy load instead of clearing it', () => {
  const client = loadClient();
  assert.equal(client.getEditLoadValue(model), 135);
  assert.equal(
    client.getEditLoadValue({ p: 'Azub', m: 'Azub 5', kg: 125 }),
    125,
  );
  assert.equal(client.getEditLoadValue({ p: 'Azub', m: 'Unknown' }), '');
});

test('public database normalization accepts v2 envelopes and legacy arrays', () => {
  const client = loadClient();
  const envelope = {
    schema_version: 2,
    CONFIG: { version: '2.0' },
    COLLAB: { Azub: 'yes' },
    DB: [model],
  };

  assert.deepEqual(
    JSON.parse(JSON.stringify(client.normalizePublicDatabase(envelope))),
    envelope,
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(client.normalizePublicDatabase([model]))),
    { DB: [model] },
  );
  assert.throws(() => client.normalizePublicDatabase({}), /DB array/);
});

test('runtime keeps moderation writes and enriches rows from GitHub', () => {
  const client = loadClient();
  const api = [
    {
      p: 'Azub',
      m: 'Azub 5',
      type: 'bike',
      kg: 150,
      url: 'https://azub.eu/edited',
      arch: false,
      check: false,
    },
  ];
  const github = { DB: [model], CONFIG: { version: '2.0' } };

  const result = plain(client.resolveRuntimeDatabase(api, github, null));
  assert.equal(result.source, 'api+github');
  assert.equal(result.stale, false);
  assert.equal(result.data.DB[0].m, 'Azub 5');
  assert.equal(result.data.DB[0].url, 'https://azub.eu/edited');
  assert.equal(result.data.DB[0].legacy_load_kg, 150);
  assert.equal(result.data.DB[0].max_rider_kg, 140);
  assert.equal(result.data.DB[0].wheel_front_in, 20);
  assert.equal(result.data.DB[0].status, 'archived');
  assert.equal(result.data.DB[0].arch, true);
});

test('new moderation rows receive visible unknown essential fields', () => {
  const client = loadClient();
  const api = [{ p: 'New Brand', m: 'New Model', type: 'bike', kg: 0, url: 'https://example.com' }];

  const result = plain(client.resolveRuntimeDatabase(api, null, null));
  assert.equal(result.source, 'api');
  assert.equal(result.data.DB[0].wheel_front_in, null);
  assert.equal(result.data.DB[0].max_rider_kg, null);
  assert.equal(result.data.DB[0].max_system_kg, null);
  assert.equal(result.data.DB[0].max_rack_kg, null);
  assert.equal(result.data.DB[0].status, 'unknown');
  assert.equal(result.data.DB[0].verification_status, 'legacy_unverified');
});

test('GitHub and cache provide read-only fallback when moderation API is empty', () => {
  const client = loadClient();
  const github = { DB: [model], CONFIG: { version: '2.0' } };
  const cached = { DB: [{ ...model, m: 'Cached' }] };

  assert.deepEqual(plain(client.resolveRuntimeDatabase([], github, null)), {
    data: github,
    source: 'github-readonly',
    stale: false,
  });
  assert.deepEqual(plain(client.resolveRuntimeDatabase([], null, cached)), {
    data: cached,
    source: 'github-readonly',
    stale: true,
  });
});

test('cached GitHub enrichment is marked stale while API writes remain authoritative', () => {
  const client = loadClient();
  const api = [{ p: 'Azub', m: 'Azub 5', type: 'bike', kg: 150, url: 'https://azub.eu/' }];
  const cached = { DB: [model] };

  const result = plain(client.resolveRuntimeDatabase(api, null, cached));
  assert.equal(result.source, 'api+github-cache');
  assert.equal(result.stale, true);
  assert.equal(result.data.DB[0].legacy_load_kg, 150);
  assert.equal(result.data.DB[0].max_rider_kg, 140);
});
