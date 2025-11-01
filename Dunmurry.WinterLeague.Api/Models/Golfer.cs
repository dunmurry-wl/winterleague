namespace Dunmurry.WinterLeague.Api.Models;

public class Golfer
{
    public int GolferId { get; set; }
    public string Name { get; set; } = null!;
    public decimal? Handicap { get; set; }
    public string? Email { get; set; }
    public int TeamId { get; set; }
}