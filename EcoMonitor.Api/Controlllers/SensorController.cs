using EcoMonitor.Api.Data;
using EcoMonitor.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
namespace EcoMonitor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SensorController: ControllerBase{
    private readonly AppDbContext _context;
    public SensorController(AppDbContext context){
        _context = context;
    }

    [HttpGet]
    public async Task<List<Sensor>> GetAllAsync(){
        return await _context.Sensors.ToListAsync();
    }

    [HttpGet("{id}", Name = "GetSensorById")]
    public async Task<ActionResult<Sensor>> GetByIdAsync(int id){
        var sensor = await _context.Sensors.FindAsync(id);

        if(sensor == null){
            return NotFound();
        }
    return sensor;
    } 
    [HttpPost]
    public async Task<ActionResult<Sensor>> CreateAsync(Sensor sensor)
    {
        _context.Sensors.Add(sensor);

        await _context.SaveChangesAsync();

        return CreatedAtRoute("GetSensorById",new { id = sensor.Id },sensor);
    }
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsync(int id, Sensor sensor)
    {
        if (id != sensor.Id)
            return BadRequest();

        _context.Entry(sensor).State = EntityState.Modified;

        await _context.SaveChangesAsync();

        return NoContent();
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var sensor = await _context.Sensors.FindAsync(id);

        if (sensor == null)
            return NotFound();

        _context.Sensors.Remove(sensor);

        await _context.SaveChangesAsync();

        return NoContent();
    }
    
}

