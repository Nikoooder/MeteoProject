using Microsoft.EntityFrameworkCore;
using TestApi.Data;
using TestApi.Models;

namespace TestApi.Repositories;

public class MeasurementRepository
{
    private readonly AppDbContext _context;

    public MeasurementRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Measurement m)
    {
        _context.Measurements.Add(m);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Measurement>> GetByTypeAndLocation(string type, string location)
    {
        return await _context.Measurements
            .Where(x => x.Type == type && x.Location == location)
            .ToListAsync();
    }

    public async Task<List<Measurement>> GetAll()
    {
        return await _context.Measurements.ToListAsync();
    }
}