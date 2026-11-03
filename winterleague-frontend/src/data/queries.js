// League business logic, run against the SQLite database with sql.js.
// Each golfer's best score in a round counts; a team's top 4 golfers in a round qualify,
// and their scores add up to the team's round score.

const QUALIFYING_GOLFERS = 4;

function all(db, sql, params = {}) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows;
  } finally {
    stmt.free();
  }
}

// CTEs ending in team_round: each team's round score for every round up to and including $roundId.
const TEAM_ROUND_SCORES = `
  best AS (
    SELECT g.team_id, s.round_id, s.golfer_id, MAX(s.points) AS best_score
    FROM score s
    JOIN golfer g ON g.golfer_id = s.golfer_id
    JOIN round r ON r.round_id = s.round_id
    WHERE r.start_date <= (SELECT start_date FROM round WHERE round_id = $roundId)
    GROUP BY g.team_id, s.round_id, s.golfer_id
  ),
  ranked AS (
    SELECT team_id, round_id, best_score,
           ROW_NUMBER() OVER (PARTITION BY team_id, round_id ORDER BY best_score DESC) AS rank
    FROM best
  ),
  team_round AS (
    SELECT team_id, round_id, SUM(best_score) AS round_score
    FROM ranked
    WHERE rank <= $qualifying
    GROUP BY team_id, round_id
  )`;

// Runs a league table query; totalsCte must define totals(team_id, total_points).
// Teams with no scores yet are listed with 0 points.
function leagueTable(db, roundId, totalsCte) {
  return all(db, `
    WITH ${TEAM_ROUND_SCORES},
    ${totalsCte}
    SELECT t.team_id AS teamId, t.name AS teamName, COALESCE(totals.total_points, 0) AS totalPoints
    FROM team t
    LEFT JOIN totals ON totals.team_id = t.team_id
    ORDER BY totalPoints DESC, teamName`,
    { $roundId: roundId, $qualifying: QUALIFYING_GOLFERS });
}

export function getRounds(db) {
  return all(db, `
    SELECT round_id AS roundId, name
    FROM round
    ORDER BY start_date`);
}

// Current format: teams are ranked by round score in each round and earn the points
// in round_position_points for their position. Equal totals use countback: compare
// the 5th-best score, then the 6th, etc. An extra score beats a missing score.
// Teams still tied share the higher position; positions with no entry earn 0.
export function getLeagueTableByPosition(db, roundId) {
  return leagueTable(db, roundId, `
    positions AS (
      SELECT team_score.team_id, 1 + (
        SELECT COUNT(*)
        FROM team_round rival
        WHERE rival.round_id = team_score.round_id
          AND (
            rival.round_score > team_score.round_score
            OR (rival.round_score = team_score.round_score AND (
              -- The first differing non-qualifying score decides whether the rival wins.
              SELECT CASE WHEN own.best_score IS NULL THEN 1
                          ELSE extra.best_score > own.best_score END
              FROM ranked extra
              LEFT JOIN ranked own ON own.team_id = team_score.team_id
                                  AND own.round_id = extra.round_id
                                  AND own.rank = extra.rank
              WHERE extra.team_id = rival.team_id
                AND extra.round_id = rival.round_id
                AND extra.rank > $qualifying
                AND (own.best_score IS NULL OR extra.best_score <> own.best_score)
              ORDER BY extra.rank
              LIMIT 1
            ) = 1)
          )
      ) AS position
      FROM team_round team_score
    ),
    totals AS (
      SELECT p.team_id, SUM(COALESCE(pp.points, 0)) AS total_points
      FROM positions p
      LEFT JOIN round_position_points pp ON pp.position = p.position
      GROUP BY p.team_id
    )`);
}

// Previous format (2025/26 season): round scores are simply added up.
export function getLeagueTableByTotalScore(db, roundId) {
  return leagueTable(db, roundId, `
    totals AS (
      SELECT team_id, SUM(round_score) AS total_points
      FROM team_round
      GROUP BY team_id
    )`);
}

// Each golfer's best score for one team in one round, best first; the top 4 are qualifying.
export function getTeamScores(db, teamId, roundId) {
  return all(db, `
    WITH best AS (
      SELECT g.golfer_id, g.name, MAX(s.points) AS best_score
      FROM score s
      JOIN golfer g ON g.golfer_id = s.golfer_id
      WHERE g.team_id = $teamId AND s.round_id = $roundId
      GROUP BY g.golfer_id, g.name
    )
    SELECT golfer_id AS golferId, name AS golferName, best_score AS bestScore,
           ROW_NUMBER() OVER (ORDER BY best_score DESC, name) <= $qualifying AS qualifying
    FROM best
    ORDER BY best_score DESC, name`,
    { $teamId: teamId, $roundId: roundId, $qualifying: QUALIFYING_GOLFERS })
    .map(row => ({ ...row, qualifying: row.qualifying === 1 }));
}
