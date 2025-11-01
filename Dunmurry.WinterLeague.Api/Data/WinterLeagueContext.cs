// Data/WinterLeagueContext.cs
using Microsoft.EntityFrameworkCore;
using Dunmurry.WinterLeague.Api.Models;

namespace Dunmurry.WinterLeague.Api.Data;

public class WinterLeagueContext(DbContextOptions<WinterLeagueContext> options) : DbContext(options)
{
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Golfer> Golfers => Set<Golfer>();
    public DbSet<Round> Rounds => Set<Round>();
    public DbSet<Score> Scores => Set<Score>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Score>()
            .HasIndex(s => new { s.GolferId, s.RoundId, s.PlayedOn })
            .IsUnique();
    }
}