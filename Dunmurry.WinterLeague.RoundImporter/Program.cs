using Dunmurry.WinterLeague.RoundImporter;
using Microsoft.Extensions.DependencyInjection;
using Dunmurry.WinterLeague.Shared.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

IConfiguration configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
    .Build();

var services = new ServiceCollection();
services.AddDbContext<WinterLeagueContext>(options =>
{
    options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"));
});
var provider = services.BuildServiceProvider();

var service = new CsvImportService(provider.GetService<WinterLeagueContext>());
await service.ImportScoresAsync("C:\\repos\\winterleague\\scores\\week1.csv");