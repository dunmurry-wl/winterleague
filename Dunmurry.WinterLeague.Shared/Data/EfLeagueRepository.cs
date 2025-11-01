using Dunmurry.WinterLeague.Shared.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Dunmurry.WinterLeague.Shared.Data;

public class EfLeagueRepository : ILeagueRepository
{
    private readonly WinterLeagueContext _context;

        public EfLeagueRepository(WinterLeagueContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<LeagueTableEntry>> GetLeagueTableAsync(int? roundId)
        {
            // Base query: filter and project only needed columns
            var baseQuery = _context.Scores
                .Where(s => !roundId.HasValue || s.RoundId <= roundId.Value)
                .Select(s => new
                {
                    s.Golfer.TeamId,
                    s.RoundId,
                    s.GolferId,
                    s.Points
                });

            // Step 1: best score per golfer per round
            var bestScores =
                (from s in baseQuery
                group s by new { s.TeamId, s.RoundId, s.GolferId } into g
                select new
                {
                    g.Key.TeamId,
                    g.Key.RoundId,
                    g.Key.GolferId,
                    BestScore = g.Max(x => x.Points)
                }).ToList();

            // Step 2: top 5 golfers per team/round using EF's window-function support
            var ranked =
                (from b in bestScores
                group b by new { b.TeamId, b.RoundId } into g
                from b in g
                    .OrderByDescending(x => x.BestScore)
                    .Take(5) // EF will convert this into ROW_NUMBER() <= 5 in SQL
                select b).ToList();

            // Step 3: aggregate team totals
            var teamTotals =
                (from r in ranked
                group r by new { r.TeamId, r.RoundId } into g
                select new
                {
                    g.Key.TeamId,
                    TotalPoints = g.Sum(x => x.BestScore)
                }).ToList();

            // Step 4: join to teams for display info
            var table =
                (from t in teamTotals
                join team in _context.Teams on t.TeamId equals team.Id
                orderby t.TotalPoints descending
                select new LeagueTableEntry
                {
                    TeamId = team.Id,
                    TeamName = team.Name,
                    TotalPoints = t.TotalPoints
                }).ToList();

            return table;
        }


        public async Task<IEnumerable<GolferScore>> GetTeamScoresAsync(int teamId, int roundId)
        {
            // Compute best score per golfer
            var bestScores = await _context.Scores
                .Where(s => s.Golfer.TeamId == teamId && s.RoundId == roundId)
                .GroupBy(s => new { s.GolferId, s.Golfer.Name })
                .Select(g => new
                {
                    g.Key.GolferId,
                    g.Key.Name,
                    BestScore = g.Max(x => x.Points)
                })
                .OrderByDescending(x => x.BestScore)
                .ToListAsync();

            // Rank and mark top 5
            var ranked = bestScores
                .Select((x, i) => new GolferScore
                {
                    GolferId = x.GolferId,
                    GolferName = x.Name,
                    BestScore = x.BestScore,
                    Qualifying = i < 5
                })
                .ToList();

            return ranked;
        }

        public async Task<IEnumerable<RoundDto>> GetRounds()
        {
            return await _context.Rounds
                .OrderBy(r => r.StartDate)
                .Select(r => new RoundDto
                {
                    RoundId = r.Id,
                    Name = r.Name
                })
                .ToListAsync();
        }
}