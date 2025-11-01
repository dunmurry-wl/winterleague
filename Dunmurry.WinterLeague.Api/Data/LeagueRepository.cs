using Dapper;
using Dunmurry.WinterLeague.Api.Models;
using System.Data;
using System.Text;
using Dunmurry.WinterLeague.Api.Models.DTO;
using Microsoft.AspNetCore.Mvc;

namespace Dunmurry.WinterLeague.Api.Data
{
    public class LeagueRepository : ILeagueRepository
    {
        private readonly PostgresService _db;

        public LeagueRepository(PostgresService db)
        {
            _db = db;
        }

        public async Task<IEnumerable<LeagueTableEntry>> GetLeagueTableAsync(int? roundId)
        {
            using IDbConnection conn = _db.GetConnection();

            string sql = @"
        WITH best_scores AS (
            SELECT
                g.team_id,
                s.round_id,
                s.golfer_id,
                MAX(s.strokes) AS best_score
            FROM golf.score s
            JOIN golf.golfer g ON s.golfer_id = g.golfer_id
            /** Filter by round if specified **/
            /** Round filter placeholder **/
            {0}
            GROUP BY g.team_id, s.round_id, s.golfer_id
        ),
        top5 AS (
            SELECT team_id, round_id, best_score
            FROM (
                SELECT *,
                       ROW_NUMBER() OVER (PARTITION BY team_id, round_id ORDER BY best_score DESC) AS rn
                FROM best_scores
            ) sub
            WHERE rn <= 5
        )
        SELECT t.team_id AS TeamId,
               t.name AS TeamName,
               SUM(top5.best_score) AS TotalPoints
        FROM top5
        JOIN golf.team t ON t.team_id = top5.team_id
        GROUP BY t.team_id, t.name
        ORDER BY TotalPoints DESC;
    ";

            string roundFilter = roundId.HasValue ? $"WHERE s.round_id <= {roundId.Value}" : "";
            sql = sql.Replace("{0}", roundFilter);
            
            return await conn.QueryAsync<LeagueTableEntry>(sql);
        }

        public async Task<IEnumerable<GolferScore>> GetTeamScoresAsync(int teamId, int roundId)
        {
            using IDbConnection conn = _db.GetConnection();

            string sql = @"
                WITH best_scores AS (
                    SELECT
                        g.golfer_id,
                        g.name AS golfer_name,
                        MAX(s.strokes) AS best_score
                    FROM golf.score s
                    JOIN golf.golfer g ON s.golfer_id = g.golfer_id
                    WHERE g.team_id = @TeamId
                      AND s.round_id = @RoundId
                    GROUP BY g.golfer_id, g.name
                ),
                ranked AS (
                    SELECT *,
                           ROW_NUMBER() OVER (ORDER BY best_score DESC) AS rn
                    FROM best_scores
                )
                SELECT golfer_id AS GolferId,
                       golfer_name AS GolferName,
                       best_score AS BestScore,
                       CASE WHEN rn <= 5 THEN TRUE ELSE FALSE END AS Qualifying
                FROM ranked
                ORDER BY rn, golfer_name;
            ";

            return await conn.QueryAsync<GolferScore>(sql, new { TeamId = teamId, RoundId = roundId });
        }

        public async Task<IEnumerable<RoundDto>> GetRounds()
        {
            using var conn = _db.GetConnection();
            var rounds = await conn.QueryAsync<RoundDto>("SELECT round_id AS RoundId, name AS Name FROM golf.round ORDER BY start_date");
            return rounds;
        }

        public async Task<byte[]> GetLogo(int teamId)
        {
            using var conn = _db.GetConnection();
            //TODO: Make safe
            var sql = new StringBuilder().Append("SELECT logo FROM teams WHERE team_id = @id").ToString();
            return await conn.ExecuteScalarAsync<byte[]>(sql, new { id = teamId });
        }
    }

    public class RoundDto
    {
        public int RoundId { get; set; }
        public string Name { get; set; }
    }
}
