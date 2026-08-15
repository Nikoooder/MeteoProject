using Microsoft.EntityFrameworkCore;
using EcoMonitor.Api.Models;

namespace EcoMonitor.Api.Data;

public class AppDbContext:DbContext{
	public DbSet<Location> Locations{get;set;}
	public DbSet<User> Users{get;set;}
	public DbSet<Measurement> Measurements{get;set;}
	public DbSet<SyncQueue> SyncQueues{get;set;}
	public AppDbContext(DbContextOptions<AppDbContext> options):base(options){}
	protected override void OnModelCreating(ModelBuilder modelBuilder){
		base.OnModelCreating(modelBuilder);
		modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
	}
	
}
