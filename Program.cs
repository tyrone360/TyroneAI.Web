using Microsoft.AspNetCore.Identity;
using TyroneAI.Web.Services;
using Microsoft.EntityFrameworkCore;
using TyroneAI.Web.Data;
using TyroneAI.Web.Models;

var builder = WebApplication.CreateBuilder(args);

// MySQL database connection
var connectionString = builder.Configuration
    .GetConnectionString("TyroneAI")
    ?? throw new InvalidOperationException(
        "TyroneAI database connection string is missing.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)));

// User authentication and registration
builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.User.RequireUniqueEmail = true;

        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();
builder.Services.AddHttpClient<TyroneAIService>(client =>
{
    client.BaseAddress = new Uri("http://localhost:11434/");
    client.Timeout = TimeSpan.FromMinutes(5);
});
builder.Services.AddTransient<EmailService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();