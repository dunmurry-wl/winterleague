using System.Globalization;
using System.Text.RegularExpressions;
using CsvHelper;
using Dunmurry.WinterLeague.Shared.Data;
using Dunmurry.WinterLeague.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace Dunmurry.WinterLeague.RoundImporter;

public class CsvImportService
{
    private readonly WinterLeagueContext _db;

    public CsvImportService(WinterLeagueContext db) => _db = db;

    /// <summary>
    /// Imports Name/Nett scores from weekN.csv using its Date footer.
    /// Creates a Saturday-to-Sunday round and skips scores already imported.
    /// Returns false if the file is invalid or contains unknown golfers.
    /// </summary>
    public async Task<bool> ImportScoresAsync(string filePath)
    {
        var match = Regex.Match(Path.GetFileNameWithoutExtension(filePath), @"^week([0-9]+)$", RegexOptions.IgnoreCase);
        if (!match.Success || !int.TryParse(match.Groups[1].Value, out var week) || week < 1)
        {
            Console.Error.WriteLine("Expected a filename such as week1.csv.");
            return false;
        }

        var rows = new List<(string Name, int Points)>();
        var disqualified = new List<string>();
        DateOnly? fileDate = null;
        try
        {
            using var reader = new StreamReader(filePath);
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
            if (!csv.Read()) throw new FormatException("The CSV is empty.");
            csv.ReadHeader();
            // Require only the two fields used for importing scores.
            csv.GetFieldIndex("Name");
            csv.GetFieldIndex("Nett");
            while (csv.Read())
            {
                var first = csv.GetField(0)?.Trim() ?? "";
                if (first.Equals("Date:", StringComparison.OrdinalIgnoreCase))
                {
                    if (fileDate.HasValue || !DateOnly.TryParseExact(csv.GetField(1)?.Trim(), "dd/MM/yyyy",
                            CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                        throw new FormatException("Expected one Date: footer in dd/MM/yyyy format.");
                    fileDate = date;
                    continue;
                }

                // Division headings, empty rows and footer metadata aren't scores.
                if (!int.TryParse(first, out var position) || position < 1) continue;
                var name = csv.GetField("Name")?.Trim() ?? "";
                var nett = csv.GetField("Nett")?.Trim() ?? "";
                if (name.Length == 0) throw new FormatException($"Missing golfer name at position {position}.");
                if (nett.Equals("DQ", StringComparison.OrdinalIgnoreCase))
                {
                    disqualified.Add(name);
                    continue;
                }
                if (!int.TryParse(nett, NumberStyles.Integer, CultureInfo.InvariantCulture, out var points) || points < 0)
                    throw new FormatException($"Invalid Nett score '{nett}' for {name}.");
                rows.Add((name, points));
            }
        }
        catch (Exception ex) when (ex is CsvHelperException or FormatException)
        {
            Console.Error.WriteLine($"Invalid scores CSV: {ex.Message}");
            return false;
        }

        if (fileDate is not { DayOfWeek: DayOfWeek.Saturday } playedOn)
        {
            Console.Error.WriteLine("The CSV must contain a Date: footer with a Saturday date (dd/MM/yyyy).");
            return false;
        }
        if (rows.Count == 0)
        {
            Console.Error.WriteLine("No numeric scores found in the CSV file.");
            return false;
        }
        if (rows.Select(r => r.Name).Distinct(StringComparer.OrdinalIgnoreCase).Count() != rows.Count)
        {
            Console.Error.WriteLine("Duplicate golfer names in the CSV; resolve these before importing.");
            return false;
        }

        var roundName = $"Week {week}";
        var endDate = playedOn.AddDays(1);
        var rounds = await _db.Rounds.Where(r => r.Name == roundName).ToListAsync();
        if (rounds.Count > 1 || rounds.Any(r => r.StartDate != playedOn || r.EndDate != endDate))
        {
            Console.Error.WriteLine($"Existing {roundName} has conflicting dates or duplicate round entries; resolve before importing.");
            return false;
        }

        await using var transaction = await _db.Database.BeginTransactionAsync();
        var round = rounds.SingleOrDefault();
        if (round == null)
        {
            round = new Round { Name = roundName, StartDate = playedOn, EndDate = endDate };
            _db.Rounds.Add(round);
            await _db.SaveChangesAsync();
        }
        Console.WriteLine($"Round: {round.Name} ({round.StartDate:yyyy-MM-dd} to {round.EndDate:yyyy-MM-dd})");

        var golfers = await _db.Golfers.ToDictionaryAsync(g => g.Name, StringComparer.OrdinalIgnoreCase);
        var existingScores = (await _db.Scores
                .Where(s => s.RoundId == round.Id)
                .Select(s => new { s.GolferId, s.PlayedOn }).ToListAsync())
            .Select(s => (s.GolferId, s.PlayedOn)).ToHashSet();
        var unknownNames = new List<string>();
        var added = 0;
        var skipped = 0;
        foreach (var row in rows)
        {
            if (!golfers.TryGetValue(row.Name, out var golfer))
            {
                unknownNames.Add(row.Name);
                continue;
            }
            if (!existingScores.Add((golfer.GolferId, playedOn)))
            {
                skipped++;
                continue;
            }
            _db.Scores.Add(new Score
            {
                GolferId = golfer.GolferId, RoundId = round.Id,
                Points = row.Points, PlayedOn = playedOn
            });
            added++;
        }
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        Console.WriteLine($"{added} scores added, {skipped} already imported, {unknownNames.Count} unknown golfers, {disqualified.Count} DQ skipped.");
        foreach (var name in disqualified) Console.WriteLine($"  DQ: {name}");
        if (unknownNames.Count > 0)
        {
            Console.WriteLine("Unmatched golfers (not imported); check membership/spelling and re-run if needed:");
            foreach (var name in unknownNames) Console.WriteLine($"  {name}");
        }
        return unknownNames.Count == 0;
    }
}
