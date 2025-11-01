using Dunmurry.WinterLeague.Shared.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevPolicy", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (origin == null) return false;

                // Allow HTTP + HTTPS on localhost and LAN
                return origin.StartsWith("http://localhost:3000") ||
                       origin.StartsWith("http://127.0.0.1:3000") ||
                       origin.StartsWith("http://192.168.") ||
                       origin.StartsWith("http://10.") ||
                       origin.StartsWith("https://localhost:3000") ||
                       origin.StartsWith("https://127.0.0.1:3000") ||
                       origin.StartsWith("https://192.168.") ||
                       origin.StartsWith("https://10.");
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
    });

    options.AddPolicy("ProdPolicy", policy =>
    {
        policy
            .WithOrigins("https://myapp.com", "https://www.myapp.com")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Database
builder.Services.AddDbContext<WinterLeagueContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// Repository
builder.Services.AddScoped<ILeagueRepository, EfLeagueRepository>();

var app = builder.Build();

// 🔹 Middleware order is important
app.UseRouting(); // Must come first

// CORS comes after routing, before authorization and endpoints
if (app.Environment.IsDevelopment())
{
    app.UseCors("DevPolicy");
}
else
{
    app.UseCors("ProdPolicy");
}

// Swagger (optional, can be before or after CORS)
app.UseSwagger();
app.UseSwaggerUI();

// HTTPS redirect only in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Authorization
app.UseAuthorization();

// Map controllers
app.MapControllers();

app.Run();
