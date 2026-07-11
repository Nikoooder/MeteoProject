using EcoMonitor.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(option s => option.UseNpgsql(builder.Configuration.GetConnectionString("Default Connection")));
