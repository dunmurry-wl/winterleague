using Dunmurry.WinterLeague.RoundImporter;
using Dunmurry.WinterLeague.Shared.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

// Usage: RoundImporter <scores.csv> [database.db]
// The database defaults to the one the website serves: database/winterleague.db
if (args.Length is < 1 or > 2)
{
    Console.Error.WriteLine("Usage: RoundImporter <scores.csv> [database.db]");
    return 1;
}

var csvPath = Path.GetFullPath(args[0]);
var dbPath = Path.GetFullPath(args.Length > 1 ? args[1] : DefaultDatabasePath());

if (!File.Exists(csvPath))
{
    Console.Error.WriteLine($"CSV file not found: {csvPath}");
    return 1;
}

// Never let SQLite silently create an empty database
if (!File.Exists(dbPath))
{
    Console.Error.WriteLine($"Database not found: {dbPath}");
    Console.Error.WriteLine("Create it with: sqlite3 <database.db> < database/schema.sql");
    return 1;
}

var connectionString = new SqliteConnectionStringBuilder
{
    DataSource = dbPath,
    Mode = SqliteOpenMode.ReadWrite,
    ForeignKeys = true,
}.ToString();

var options = new DbContextOptionsBuilder<WinterLeagueContext>().UseSqlite(connectionString).Options;
await using var db = new WinterLeagueContext(options);

Console.WriteLine($"Importing {csvPath}");
Console.WriteLine($"     into {dbPath}");
return await new CsvImportService(db).ImportScoresAsync(csvPath) ? 0 : 1;

static string DefaultDatabasePath()
{
    // Find the solution folder from either the working directory or the build output folder
    foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
    {
        for (var dir = new DirectoryInfo(start); dir != null; dir = dir.Parent)
        {
            if (File.Exists(Path.Combine(dir.FullName, "Dunmurry.WinterLeague.sln")))
                return Path.Combine(dir.FullName, "database", "winterleague.db");
        }
    }

    throw new InvalidOperationException("Couldn't find the solution folder - pass the database path explicitly.");
}
