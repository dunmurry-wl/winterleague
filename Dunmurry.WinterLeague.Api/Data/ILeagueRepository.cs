using Dunmurry.WinterLeague.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dunmurry.WinterLeague.Api.Models.DTO;
using Microsoft.AspNetCore.Mvc;

namespace Dunmurry.WinterLeague.Api.Data
{
    public interface ILeagueRepository
    {
        Task<IEnumerable<LeagueTableEntry>> GetLeagueTableAsync(int? roundId);
        Task<IEnumerable<GolferScore>> GetTeamScoresAsync(int teamId, int roundId);
        Task<IEnumerable<RoundDto>> GetRounds();
        Task<byte[]> GetLogo(int teamId);
    }
}