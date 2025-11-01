namespace Dunmurry.WinterLeague.Api.Models;

public class Score
{
    public int ScoreId { get; set; }
    public int GolferId { get; set; }
    public int RoundId { get; set; }
    public DateTime PlayedOn { get; set; }
    public int Strokes { get; set; }
}