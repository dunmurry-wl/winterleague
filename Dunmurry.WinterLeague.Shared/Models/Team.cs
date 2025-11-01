// Models/Team.cs

using System.ComponentModel.DataAnnotations.Schema;

namespace Dunmurry.WinterLeague.Shared.Models;

public class Team
{
    [Column("team_id")]
    public int Id { get; set; }
    [Column("name")]
    public string Name { get; set; }
    public ICollection<Golfer> Golfers { get; set; }
}