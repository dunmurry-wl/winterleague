namespace Dunmurry.WinterLeague.Shared.Models.DTO;

public class GolferScore
{
    public int GolferId { get; set; }
    public string GolferName { get; set; } = null!;
    public int BestScore { get; set; }
    public bool Qualifying { get; set; }
}