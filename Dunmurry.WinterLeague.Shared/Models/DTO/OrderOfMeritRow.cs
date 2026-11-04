namespace Dunmurry.WinterLeague.Shared.Models.DTO;

public class OrderOfMeritRow
{
    public int Position { get; set; }
    public int GolferId { get; set; }
    public string Name { get; set; }
    public int Points { get; set; }
}

public class ScoreHistoryRow
{
    public string Round { get; set; }
    public int Points { get; set; }
}