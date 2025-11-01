// Data/PostgresService.cs
using System.Data;
using Npgsql;

namespace Dunmurry.WinterLeague.Api.Data
{
    public class PostgresService
    {
        private readonly string? _connectionString;

        public PostgresService(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
        }

        public IDbConnection GetConnection()
        {
            return new NpgsqlConnection(_connectionString);
        }
    }
}