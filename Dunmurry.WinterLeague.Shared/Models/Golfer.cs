using System.ComponentModel.DataAnnotations.Schema;

namespace Dunmurry.WinterLeague.Shared.Models;

public class Golfer
{
    [Column("golfer_id")]
    public int GolferId { get; set; }
    [Column("name")]
    public string Name { get; set; }
    [Column("team_id")]
    public int TeamId { get; set; }
    public Team Team { get; set; }
    public ICollection<Score> Scores { get; set; }
}