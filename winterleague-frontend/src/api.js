import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import * as queries from './data/queries';

// Overridable for local testing, e.g. `npm run dev:testdata` uses winterleague.test.db
const DB_FILE = import.meta.env.VITE_DB_FILE || 'winterleague.db';

let dbPromise;

async function loadDb() {
  const [SQL, response] = await Promise.all([
    initSqlJs({ locateFile: () => wasmUrl }),
    // no-cache: revalidate so a newly deployed database shows up straight away
    fetch(`${import.meta.env.BASE_URL}${DB_FILE}`, { cache: 'no-cache' }),
  ]);
  if (!response.ok) throw new Error(`Failed to load league database (${response.status})`);
  return new SQL.Database(new Uint8Array(await response.arrayBuffer()));
}

// Download and open the league database once, on first use.
function getDb() {
  if (!dbPromise) {
    dbPromise = loadDb();
    dbPromise.catch(() => { dbPromise = undefined; }); // allow a retry after a failed load
  }
  return dbPromise;
}

export const getRounds = async () => queries.getRounds(await getDb());
export const getLeagueTable = async (roundId) => queries.getLeagueTableByPosition(await getDb(), roundId);
export const getTeamScores = async (teamId, roundId) => queries.getTeamScores(await getDb(), teamId, roundId);
