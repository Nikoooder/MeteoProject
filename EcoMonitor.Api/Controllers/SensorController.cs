using EcoMonitor.Api.Data;
using EcoMonitor.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;


[ApiController]
[Route("api/[controller]")]
public class SensorController(){
    private readonly AppDbContext _context;
    public async Task<List<Sensor>> GetAllAsync()
        {
            return await _context.Sensors.ToListAsync();
        }
}

