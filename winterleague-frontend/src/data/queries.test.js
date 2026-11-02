// @vitest-environment node
import { readFileSync } from 'node:fs';
import initSqlJs from 'sql.js';
import { getLeagueTableByPosition, getLeagueTableByTotalScore, getRounds, getTeamScores } from './queries';

const schema = readFileSync(new URL('../../../database/schema.sql', import.meta.url), 'utf8');

let db;

// Round IDs deliberately don't follow date order, to prove ordering uses start_date.
const WEEK_1 = 20;
const WEEK_2 = 10;
const WEEK_3 = 30;

beforeEach(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  db.run(schema);
  db.run(`
    INSERT INTO round (round_id, name, start_date, end_date) VALUES
      (${WEEK_2}, 'Week 2', '2026-11-08', '2026-11-14'),
      (${WEEK_1}, 'Week 1', '2026-11-01', '2026-11-07'),
      (${WEEK_3}, 'Week 3', '2026-11-15', '2026-11-21');
    INSERT INTO team (team_id, name) VALUES (1, 'Eagles'), (2, 'Birdies'), (3, 'Bogeys');
    INSERT INTO golfer (golfer_id, team_id, name) VALUES
      (1, 1, 'Ann'), (2, 1, 'Bob'), (3, 1, 'Cat'), (4, 1, 'Dan'), (5, 1, 'Eve'), (6, 1, 'Fay'),
      (7, 2, 'Gus'), (8, 2, 'Hal');
  `);
});

afterEach(() => db.close());

function addScore(golferId, roundId, playedOn, points) {
  db.run('INSERT INTO score (golfer_id, round_id, played_on, points) VALUES (?, ?, ?, ?)',
    [golferId, roundId, playedOn, points]);
}

describe('getRounds', () => {
  test('orders rounds by start date', () => {
    expect(getRounds(db)).toEqual([
      { roundId: WEEK_1, name: 'Week 1' },
      { roundId: WEEK_2, name: 'Week 2' },
      { roundId: WEEK_3, name: 'Week 3' },
    ]);
  });
});

describe('getLeagueTableByTotalScore', () => {
  test('lists every team with 0 points before any scores', () => {
    expect(getLeagueTableByTotalScore(db, WEEK_1)).toEqual([
      { teamId: 2, teamName: 'Birdies', totalPoints: 0 },
      { teamId: 3, teamName: 'Bogeys', totalPoints: 0 },
      { teamId: 1, teamName: 'Eagles', totalPoints: 0 },
    ]);
  });

  test("counts only each team's top 5 golfers in a round", () => {
    [30, 25, 20, 15, 10, 5].forEach((points, i) => addScore(i + 1, WEEK_1, '2026-11-01', points));

    expect(getLeagueTableByTotalScore(db, WEEK_1)[0]).toEqual({ teamId: 1, teamName: 'Eagles', totalPoints: 100 });
  });

  test("counts only a golfer's best score in a round", () => {
    addScore(7, WEEK_1, '2026-11-01', 18);
    addScore(7, WEEK_1, '2026-11-04', 32);

    expect(getLeagueTableByTotalScore(db, WEEK_1)[0]).toEqual({ teamId: 2, teamName: 'Birdies', totalPoints: 32 });
  });

  test('picks the top 5 separately in each round', () => {
    // Fay is 6th in week 1 but in the top 5 in week 2
    [30, 25, 20, 15, 10, 5].forEach((points, i) => addScore(i + 1, WEEK_1, '2026-11-01', points));
    addScore(6, WEEK_2, '2026-11-08', 40);

    expect(getLeagueTableByTotalScore(db, WEEK_2)[0].totalPoints).toBe(140);
  });

  test('includes rounds up to and including the selected one, by date', () => {
    addScore(7, WEEK_1, '2026-11-01', 10);
    addScore(7, WEEK_2, '2026-11-08', 20);
    addScore(7, WEEK_3, '2026-11-15', 40);

    const points = (roundId) => getLeagueTableByTotalScore(db, roundId).find(t => t.teamId === 2).totalPoints;
    expect(points(WEEK_1)).toBe(10);
    expect(points(WEEK_2)).toBe(30);
    expect(points(WEEK_3)).toBe(70);
  });

  test('orders teams by total points, highest first', () => {
    addScore(1, WEEK_1, '2026-11-01', 20);
    addScore(7, WEEK_1, '2026-11-01', 30);

    expect(getLeagueTableByTotalScore(db, WEEK_1).map(t => t.teamName)).toEqual(['Birdies', 'Eagles', 'Bogeys']);
  });
});

describe('getLeagueTableByPosition', () => {
  // Default points from schema.sql: 1st 18, 2nd 16, 3rd 14, ...
  const table = (roundId) => getLeagueTableByPosition(db, roundId)
    .map(t => [t.teamName, t.totalPoints]);

  test('lists every team with 0 points before any scores', () => {
    expect(table(WEEK_1)).toEqual([['Birdies', 0], ['Bogeys', 0], ['Eagles', 0]]);
  });

  test('awards points for finishing position in the round; teams with no scores get 0', () => {
    addScore(1, WEEK_1, '2026-11-01', 30);
    addScore(7, WEEK_1, '2026-11-01', 20);

    expect(table(WEEK_1)).toEqual([['Eagles', 18], ['Birdies', 16], ['Bogeys', 0]]);
  });

  test("ranks teams on their top 5 golfers' best scores", () => {
    // Eagles' top 5 make 90 (Fay's 6th-best 10 doesn't count), beaten by Birdies' 95
    [50, 10, 10, 10, 10, 10].forEach((points, i) => addScore(i + 1, WEEK_1, '2026-11-01', points));
    addScore(7, WEEK_1, '2026-11-01', 50);
    addScore(8, WEEK_1, '2026-11-01', 40);
    addScore(8, WEEK_1, '2026-11-03', 45);

    expect(table(WEEK_1)).toEqual([['Birdies', 18], ['Eagles', 16], ['Bogeys', 0]]);
  });

  test('adds up position points over rounds up to and including the selected one', () => {
    addScore(1, WEEK_1, '2026-11-01', 30);
    addScore(7, WEEK_1, '2026-11-01', 20);
    addScore(1, WEEK_2, '2026-11-08', 20);
    addScore(7, WEEK_2, '2026-11-08', 30);
    addScore(1, WEEK_3, '2026-11-15', 30);
    addScore(7, WEEK_3, '2026-11-15', 20);

    expect(table(WEEK_1).slice(0, 2)).toEqual([['Eagles', 18], ['Birdies', 16]]);
    expect(table(WEEK_2).slice(0, 2)).toEqual([['Birdies', 34], ['Eagles', 34]]);
    expect(table(WEEK_3).slice(0, 2)).toEqual([['Eagles', 52], ['Birdies', 50]]);
  });

  test('tied teams share the higher position and the next team drops a place', () => {
    db.run("INSERT INTO golfer (golfer_id, team_id, name) VALUES (9, 3, 'Ida')");
    addScore(1, WEEK_1, '2026-11-01', 30);
    addScore(7, WEEK_1, '2026-11-01', 30);
    addScore(9, WEEK_1, '2026-11-01', 10);

    expect(table(WEEK_1)).toEqual([['Birdies', 18], ['Eagles', 18], ['Bogeys', 14]]);
  });

  test('uses the points in round_position_points, with 0 for positions not listed', () => {
    db.run('DELETE FROM round_position_points');
    db.run('INSERT INTO round_position_points (position, points) VALUES (1, 10), (2, 5)');
    db.run("INSERT INTO golfer (golfer_id, team_id, name) VALUES (9, 3, 'Ida')");
    addScore(1, WEEK_1, '2026-11-01', 30);
    addScore(7, WEEK_1, '2026-11-01', 20);
    addScore(9, WEEK_1, '2026-11-01', 10);

    expect(table(WEEK_1)).toEqual([['Eagles', 10], ['Birdies', 5], ['Bogeys', 0]]);
  });
});

describe('getTeamScores', () => {
  test("returns each golfer's best score for the round, marking the top 5 as qualifying", () => {
    [30, 25, 20, 15, 10, 5].forEach((points, i) => addScore(i + 1, WEEK_1, '2026-11-01', points));
    addScore(6, WEEK_1, '2026-11-03', 8);   // Fay's better score that week
    addScore(1, WEEK_2, '2026-11-08', 99);  // different round, ignored

    expect(getTeamScores(db, 1, WEEK_1)).toEqual([
      { golferId: 1, golferName: 'Ann', bestScore: 30, qualifying: true },
      { golferId: 2, golferName: 'Bob', bestScore: 25, qualifying: true },
      { golferId: 3, golferName: 'Cat', bestScore: 20, qualifying: true },
      { golferId: 4, golferName: 'Dan', bestScore: 15, qualifying: true },
      { golferId: 5, golferName: 'Eve', bestScore: 10, qualifying: true },
      { golferId: 6, golferName: 'Fay', bestScore: 8, qualifying: false },
    ]);
  });

  test('only includes golfers from the requested team', () => {
    addScore(1, WEEK_1, '2026-11-01', 30);
    addScore(7, WEEK_1, '2026-11-01', 30);

    expect(getTeamScores(db, 2, WEEK_1).map(g => g.golferName)).toEqual(['Gus']);
  });
});
