using Dunmurry.WinterLeague.Shared.Data;
using Microsoft.AspNetCore.Mvc;

namespace Dunmurry.WinterLeague.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeagueController : ControllerBase
    {
        private readonly ILeagueRepository _repo;

        public LeagueController(ILeagueRepository repo)
        {
            _repo = repo;
        }

        [HttpGet("table")]
        public async Task<IActionResult> GetLeagueTable([FromQuery] int? roundId)
        {
            var table = await _repo.GetLeagueTableAsync(roundId);
            return Ok(table);
        }

        [HttpGet("team-scores")]
        public async Task<IActionResult> GetTeamScores([FromQuery] int teamId, [FromQuery] int roundId)
        {
            var scores = await _repo.GetTeamScoresAsync(teamId, roundId);
            return Ok(scores);
        }
        
        [HttpGet("rounds")]
        public async Task<IActionResult> GetRounds()
        {
            var rounds = await _repo.GetRounds();
            return Ok(rounds);
        }

       /* [HttpGet("{teamId}/logo")]
        public async Task<IActionResult> GetTeamLogo(int teamId)
        {
            var logoBytes = await _repo.GetLogo(teamId);
            return File(logoBytes);
        }*/

    }
}