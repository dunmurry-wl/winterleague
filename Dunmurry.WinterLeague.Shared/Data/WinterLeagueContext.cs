using Microsoft.EntityFrameworkCore;
using Dunmurry.WinterLeague.Shared.Models;

namespace Dunmurry.WinterLeague.Shared.Data;

public class WinterLeagueContext : DbContext
{

    public WinterLeagueContext(DbContextOptions<WinterLeagueContext> options) : base(options)
    {
        
    }
    public DbSet<Team> Teams { get; set; }
    public DbSet<Golfer> Golfers { get; set; }
    public DbSet<Score> Scores { get; set; }
    public DbSet<Round> Rounds { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("golf");

        modelBuilder.Entity<Team>().ToTable("team").HasKey(t => t.Id);
        modelBuilder.Entity<Golfer>().ToTable("golfer").HasKey(g => g.GolferId);
        modelBuilder.Entity<Score>().ToTable("score").HasKey(s => s.Id);
        modelBuilder.Entity<Round>().ToTable("round").HasKey(r => r.Id);
    }
}