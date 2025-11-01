namespace Dunmurry.WinterLeague.Api.Models;

public class Round
{
    public int RoundId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Name { get; set; }
}