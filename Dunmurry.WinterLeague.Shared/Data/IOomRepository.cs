using Dunmurry.WinterLeague.Shared.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Dunmurry.WinterLeague.Shared.Data;

public interface IOomRepository
{
    public Task<IEnumerable<OrderOfMeritRow>> GetOrderOfMerit(int roundId);
    public Task<IEnumerable<ScoreHistoryRow>> GetScoreHistory(int golferId);
}

public class OomRepository(WinterLeagueContext context) : IOomRepository
{
    public async Task<IEnumerable<OrderOfMeritRow>> GetOrderOfMerit(int roundId)
    {
        var scores = await context.Scores.Where(x => x.RoundId <= roundId)
            .Include(score => score.Golfer).ToListAsync();
        var groups = scores.GroupBy(x => x.Golfer);
        var orderedGroups = groups.OrderByDescending(x => x.Sum(y => y.Points));
        return orderedGroups.Select((grp, index) => new OrderOfMeritRow
        {
            GolferId = grp.Key.GolferId,
            Name = grp.Key.Name,
            Points = grp.Sum(x => x.Points),
            Position = index + 1
        });
    }

    public async Task<IEnumerable<ScoreHistoryRow>> GetScoreHistory(int golferId)
    {
        throw new NotImplementedException();
    }
}