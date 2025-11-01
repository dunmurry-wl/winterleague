using System.ComponentModel.DataAnnotations.Schema;

namespace Dunmurry.WinterLeague.Shared.Models;

public class Round
{
    [Column("round_id")]
    public int Id { get; set; }
    [Column("name")]
    public string Name { get; set; }
    [Column("start_date")]
    public DateTime StartDate { get; set; }
    [Column("end_date")]
    public DateTime EndDate { get; set; }
}