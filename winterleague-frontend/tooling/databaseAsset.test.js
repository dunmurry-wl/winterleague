// @vitest-environment node
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, createServer } from 'vite';
import databaseAsset from './databaseAsset';

let workspace;
let root;

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'winterleague-db-'));
  root = join(workspace, 'winterleague-frontend');
  mkdirSync(root);
  mkdirSync(join(workspace, 'database'));
  mkdirSync(join(root, 'public'));
  writeFileSync(join(root, 'index.html'), '<script type="module" src="/main.js"></script>');
  writeFileSync(join(root, 'main.js'), 'import file from "virtual:winterleague-db"; console.log(file);');
  writeFileSync(join(workspace, 'database/winterleague.db'), 'database version one');
  writeFileSync(join(workspace, 'database/winterleague.test.db'), 'dummy data');
});

afterEach(() => rmSync(workspace, { recursive: true, force: true }));

async function buildDatabase() {
  const result = await build({
    configFile: false,
    root,
    base: '/winterleague/',
    plugins: [databaseAsset()],
    logLevel: 'silent',
    build: { write: true },
  });
  const database = result.output.find((file) => file.fileName.endsWith('.db'));
  const javascript = result.output.find((file) => file.type === 'chunk');
  expect(javascript.code).toContain(database.fileName);
  expect(existsSync(join(root, 'dist/winterleague.db'))).toBe(false);
  expect(readdirSync(join(root, 'dist')).filter((name) => name.endsWith('.db'))).toEqual([database.fileName]);
  expect(readFileSync(join(root, 'dist', database.fileName))).toEqual(Buffer.from(database.source));
  return database;
}

test('keeps the database URL across UI changes and changes it when the database changes', async () => {
  const first = await buildDatabase();
  expect(first.fileName).toMatch(/^winterleague\.[a-f0-9]{16}\.db$/);
  expect(Buffer.from(first.source)).toEqual(readFileSync(join(workspace, 'database/winterleague.db')));

  writeFileSync(join(root, 'main.js'), 'import file from "virtual:winterleague-db"; console.log("new UI", file);');
  expect((await buildDatabase()).fileName).toBe(first.fileName);

  writeFileSync(join(workspace, 'database/winterleague.db'), 'database version two');
  const updated = await buildDatabase();
  expect(updated.fileName).not.toBe(first.fileName);
  expect(Buffer.from(updated.source).toString()).toBe('database version two');
});

test('fails the build if the real database is missing', async () => {
  rmSync(join(workspace, 'database/winterleague.db'));
  await expect(buildDatabase()).rejects.toThrow(/winterleague\.db/);
});

test('uses the real database for builds even with a dummy-data override', async () => {
  writeFileSync(join(root, '.env.production'), 'VITE_DB_FILE=winterleague.test.db');
  const database = await buildDatabase();
  expect(Buffer.from(database.source).toString()).toBe('database version one');
});

test('preserves the dummy database override in development', async () => {
  writeFileSync(join(root, '.env.testdata'), 'VITE_DB_FILE=winterleague.test.db');
  const server = await createServer({
    configFile: false,
    root,
    mode: 'testdata',
    plugins: [databaseAsset()],
    server: { middlewareMode: true, watch: null },
    logLevel: 'silent',
  });
  try {
    const result = await server.transformRequest('virtual:winterleague-db');
    expect(result.code).toContain('winterleague.test.db');
    expect(result.code).toContain('import.meta.env.VITE_DB_FILE');
    expect((await requestDatabase(server, 'winterleague.test.db')).source).toBe('dummy data');
    writeFileSync(join(workspace, 'database/winterleague.test.db'), 'updated dummy data');
    expect((await requestDatabase(server, 'winterleague.test.db')).source).toBe('updated dummy data');
  } finally {
    await server.close();
  }
});

function requestDatabase(server, filename = 'winterleague.db') {
  return new Promise((resolve, reject) => {
    const headers = {};
    server.middlewares.handle(
      { url: `${server.config.base}${filename}`, method: 'GET', headers: { host: 'localhost' } },
      {
        getHeader: (name) => headers[name],
        setHeader: (name, value) => { headers[name] = value; },
        end: (source) => resolve({ source: source.toString(), headers }),
      },
      (error) => reject(error || new Error('Database request was not handled')),
    );
  });
}

test('serves the source database outside public during development, including local updates', async () => {
  const server = await createServer({
    configFile: false,
    root,
    base: '/winterleague/',
    plugins: [databaseAsset()],
    server: { middlewareMode: true, watch: null },
    logLevel: 'silent',
  });
  try {
    const first = await requestDatabase(server);
    expect(first.source).toBe('database version one');
    expect(first.headers['Content-Type']).toBe('application/vnd.sqlite3');
    expect(first.headers['Cache-Control']).toBe('no-cache');

    writeFileSync(join(workspace, 'database/winterleague.db'), 'new local scores');
    expect((await requestDatabase(server)).source).toBe('new local scores');
  } finally {
    await server.close();
  }
});
