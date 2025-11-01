namespace Dunmurry.WinterLeague.Shared.Models.DTO;

public class LeagueTableEntry
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = null!;
    public int TotalPoints { get; set; }
}