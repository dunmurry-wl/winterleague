The database is versioned automatically during `npm run build` (also run by
`npm run deploy`). Keep updating `database/winterleague.db` at the repository root
with the usual importer. It lives beside `database/schema.sql`, outside the frontend's
public directory.

`databaseAsset.js` reads the database once per build and emits a copy named
`winterleague.<sha256-prefix>.db`. The same bytes always produce the same filename;
database changes produce a new filename. The app imports this filename through
`virtual:winterleague-db` and uses ordinary HTTP caching. No manual version bump
or timestamp is needed.

Only the hashed database is included in the production output. During development,
the plugin serves the source database at `/winterleague/winterleague.db`, reading
the file on each request so local imports are visible after refreshing the page.
Dummy data stays off the live site: production builds always version the real
database, while `npm run dev:testdata` uses `VITE_DB_FILE=winterleague.test.db` to
select `database/winterleague.test.db` locally. The plugin serves that file at
`/winterleague/winterleague.test.db` during development only; it is never copied
to the production output.

Browsers may revalidate expired cache entries or download files after eviction.
Users discover the latest database when they load the updated app; already-open
tabs keep their in-memory database until reloaded. GitHub Pages deployment and
HTML caching can delay when an updated app becomes visible.
