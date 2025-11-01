using System.Globalization;
using CsvHelper;
using Dunmurry.WinterLeague.Shared.Data;
using Dunmurry.WinterLeague.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace Dunmurry.WinterLeague.RoundImporter;

public class CsvImportService
{
    private readonly WinterLeagueContext _db;

    public CsvImportService(WinterLeagueContext db)
    {
        _db = db;
    }

    public async Task ImportScoresAsync(string filePath)
    {
        using var reader = new StreamReader(filePath);
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
        var records = csv.GetRecords<ScoreCsvRow>();
        var scoreCsvRows = records as ScoreCsvRow[] ?? records.ToArray();
        var roundDate = scoreCsvRows.Select(x => x.Date).MedianDate();
        var dateUtc = DateTime.SpecifyKind(roundDate.GetValueOrDefault(), DateTimeKind.Utc);

        // Cache all people for quick lookup (important for performance)
        var existingPeople = await _db.Golfers.ToDictionaryAsync(p => p.Name, p => p);
        var round = await _db.Rounds.FirstAsync(x => x.StartDate < dateUtc && x.EndDate > dateUtc);

        var insertedRows = 0;
        foreach (var row in scoreCsvRows)
        {
            if (!existingPeople.TryGetValue(row.Name, out var person))
            {
                continue;
            }

            var score = new Score
            {
                GolferId = person.GolferId,
                Golfer = person,
                Round = round,
                RoundId = round.Id,
                Points = row.Score ?? 0,
                PlayedOn = DateTime.SpecifyKind(row.Date, DateTimeKind.Utc)
            };

            _db.Scores.Add(score);
            try
            {
                await _db.SaveChangesAsync();
                insertedRows++;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Couldn't insert row for {score.Golfer.Name}: {ex.Message}");
            }
        }

        var dupes = _db.Scores.GroupBy(x => x.GolferId).Select(y => y.Count());

        Console.WriteLine($"{insertedRows} rows inserted of an attempted {scoreCsvRows.Length}");
    }

    private class ScoreCsvRow
    {
        public string Name { get; set; } = string.Empty;
        public int? Score { get; set; }
        public DateTime Date { get; set; }
    }
}