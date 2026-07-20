using EcoMonitor.Api.Data;
using EcoMonitor.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
namespace EcoMonitor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SensorController: ControllerBase{
    private readonly AppDbContext _context;
    public SensorController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<List<Sensor>> GetAllAsync()
        {
            return await _context.Sensors.ToListAsync();
        }
    
}

