using Dunmurry.WinterLeague.Shared.Models.DTO;
using Dunmurry.WinterLeague.Shared.Models;

namespace Dunmurry.WinterLeague.Shared.Data
{
    public interface ILeagueRepository
    {
        Task<IEnumerable<LeagueTableEntry>> GetLeagueTableAsync(int? roundId);
        Task<IEnumerable<GolferScore>> GetTeamScoresAsync(int teamId, int roundId);
        Task<IEnumerable<RoundDto>> GetRounds();  
    }
}