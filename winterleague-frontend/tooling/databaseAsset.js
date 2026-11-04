import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const moduleId = 'virtual:winterleague-db';
const resolvedModuleId = `\0${moduleId}`;

// The importer owns the source database; the frontend publishes a versioned copy.
export default function databaseAsset() {
  let config;
  let sourcePath;
  let filename;

  return {
    name: 'database-asset',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
      sourcePath = resolve(config.root, '../database/winterleague.db');
    },
    configureServer(server) {
      // Preserve the browser-facing dev URL without putting the source in public/.
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split('?')[0];
        const dbName = ['winterleague.db', 'winterleague.test.db'].find((name) =>
          pathname === `/${name}` || pathname === `${config.base}${name}`);
        if (!['GET', 'HEAD'].includes(req.method) || !dbName) {
          return next();
        }

        readFile(resolve(config.root, '../database', dbName)).then((source) => {
          res.setHeader('Content-Type', 'application/vnd.sqlite3');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(req.method === 'HEAD' ? undefined : source);
        }).catch(next);
      });
    },
    buildStart() {
      if (config.command !== 'build') return;

      const source = readFileSync(sourcePath);
      const hash = createHash('sha256').update(source).digest('hex').slice(0, 16);
      filename = `winterleague.${hash}.db`;
      this.addWatchFile(sourcePath);
      this.emitFile({ type: 'asset', fileName: filename, source });
    },
    resolveId(id) {
      if (id === moduleId) return resolvedModuleId;
    },
    load(id) {
      if (id !== resolvedModuleId) return;
      // Dummy data overrides are for local development; builds always use real data.
      return config.command === 'build'
        ? `export default ${JSON.stringify(filename)};`
        : 'export default import.meta.env.VITE_DB_FILE || "winterleague.db";';
    },
  };
}
