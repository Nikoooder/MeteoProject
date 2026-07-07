using Microsoft.EntityFrameworkCore;
using TestApi.Data;
using TestApi.Repositories;
using TestApi.Services;

var builder = WebApplication.CreateBuilder(args);

// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// DI (зависимости)
builder.Services.AddScoped<MeasurementRepository>();
builder.Services.AddScoped<MeasurementService>();
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<UserService>();
// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();