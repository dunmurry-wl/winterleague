-- Winter League SQLite schema.
-- Create a fresh database with:
--   sqlite3 database/winterleague.db < database/schema.sql

PRAGMA foreign_keys = ON;

-- Dates are stored as ISO-8601 text (YYYY-MM-DD) so they sort and compare correctly.
CREATE TABLE round (
    round_id   INTEGER PRIMARY KEY,
    name       TEXT    NOT NULL,
    start_date TEXT    NOT NULL,
    end_date   TEXT    NOT NULL,
    CHECK (start_date <= end_date)
);

CREATE TABLE team (
    team_id INTEGER PRIMARY KEY,
    name    TEXT    NOT NULL UNIQUE
);

-- Golfer names must be unique: the round importer matches CSV rows to golfers by name.
CREATE TABLE golfer (
    golfer_id INTEGER PRIMARY KEY,
    team_id   INTEGER NOT NULL REFERENCES team (team_id) ON DELETE CASCADE,
    name      TEXT    NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE score (
    score_id  INTEGER PRIMARY KEY,
    golfer_id INTEGER NOT NULL REFERENCES golfer (golfer_id) ON DELETE CASCADE,
    round_id  INTEGER NOT NULL REFERENCES round (round_id) ON DELETE CASCADE,
    played_on TEXT    NOT NULL,
    points    INTEGER NOT NULL,
    UNIQUE (golfer_id, round_id, played_on)
);

CREATE INDEX score_round_id ON score (round_id);

-- League points a team earns for finishing in each position in a round (1 = best round score).
-- Positions with no row earn 0.
CREATE TABLE round_position_points (
    position INTEGER PRIMARY KEY CHECK (position >= 1),
    points   INTEGER NOT NULL
);

INSERT INTO round_position_points (position, points) VALUES
    (1, 18), (2, 16), (3, 14), (4, 12), (5, 10), (6, 8), (7, 6), (8, 4), (9, 2);
