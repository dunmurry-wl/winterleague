using System.ComponentModel.DataAnnotations.Schema;

namespace Dunmurry.WinterLeague.Shared.Models;

public class Score
{
    [Column("score_id")]
    public int Id { get; set; }
    [Column("golfer_id")]
    public int GolferId { get; set; }
    [Column("round_id")]
    public int RoundId { get; set; }
    [Column("points")]
    public int Points { get; set; }

    public Golfer Golfer { get; set; }
    public Round Round { get; set; }
    [Column("played_on")]
    public DateTime PlayedOn { get; set; }
}