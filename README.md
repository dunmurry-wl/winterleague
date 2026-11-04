# Dunmurry Winter League

A static website showing the winter league table, hosted on GitHub Pages at
https://dunmurry-wl.github.io/winterleague/.

There's no server: the React app (`winterleague-frontend`) downloads a SQLite database
(`database/winterleague.db`) and queries it in the browser with
[sql.js](https://sql.js.org). Scores are added to the database locally with the round importer,
then the updated database is committed and deployed.

## Scoring

- Each golfer's **best score** in a round counts.
- A team's **top 5** golfers in a round add up to the team's **round score**.
- Teams are ranked on round score in each round and earn league points for their position,
  as set in the `round_position_points` table (by default 1st 18, 2nd 16, 3rd 14 … 9th 2;
  lower positions earn 0). Tied teams share the higher position.
- The league table adds up league points over every round to date.

To change the points, edit `round_position_points` in the database (and the defaults in
`database/schema.sql` for future seasons). This logic lives in
`winterleague-frontend/src/data/queries.js`; the previous season's format, which added up
round scores directly, is kept there as `getLeagueTableByTotalScore`.

## Setting up a new season

Create an empty database from the schema (this replaces any existing one):

```sh
rm -f database/winterleague.db
sqlite3 database/winterleague.db < database/schema.sql
```

Then add the rounds, teams and golfers, either with a SQL GUI (Rider's Database tool,
DB Browser for SQLite) or with SQL like this:

```sql
INSERT INTO round (name, start_date, end_date) VALUES
  ('Week 1', '2026-11-01', '2026-11-07'),
  ('Week 2', '2026-11-08', '2026-11-14');

INSERT INTO team (name) VALUES ('Eagles'), ('Birdies');

INSERT INTO golfer (team_id, name) VALUES
  ((SELECT team_id FROM team WHERE name = 'Eagles'), 'Jane Smith'),
  ((SELECT team_id FROM team WHERE name = 'Birdies'), 'John Brown');
```

Dates must be `YYYY-MM-DD`. Golfer names must match the names in the score CSVs
(case doesn't matter).

## Adding a week's scores

1. Save the scoresheet export as `scores/week1.csv` (or `week2.csv`, etc.).
   The importer reads `Name` and `Nett` from numbered result rows, ignoring other columns,
   division headings and footer metadata except `Date:`. The footer date must be a Saturday
   in `dd/MM/yyyy` format. `DQ` results are reported and skipped.
2. Import it from the repository root:

   ```sh
   dotnet run --project Dunmurry.WinterLeague.RoundImporter -- scores/week1.csv
   ```

   The importer creates `Week 1` from `week1.csv`, using the footer date as the round start
   and each score's played date; the round ends the following Sunday. Re-running reuses
   the round and skips existing scores. A round with the same name but conflicting dates
   is rejected. Unmatched golfers are reported and skipped while matched scores are saved;
   the command returns a nonzero exit code when names remain unmatched. Check membership
   and spelling before adding golfers or re-running. Invalid files are rejected before saving.
3. Check the result locally: `cd winterleague-frontend && npm run dev`.
4. Commit `database/winterleague.db` and deploy: `npm run deploy`.

## Development

```sh
cd winterleague-frontend
npm install
npm run dev           # local dev server, serving database/winterleague.db
npm run dev:testdata  # local dev server, using the dummy data in database/winterleague.test.db
npm test              # unit tests
npm run deploy  # build and publish to GitHub Pages
```
