using Microsoft.EntityFrameworkCore;
using TestApi.Models;
namespace TestApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Measurement> Measurements { get; set; }
    public DbSet<User> Users { get; set; }
}