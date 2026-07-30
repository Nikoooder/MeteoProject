using EcoMonitor.Api.Data;
using EcoMonitor.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
namespace EcoMonitor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationController:ControllerBase{
    private readonly AppDbContext _context;
    public LocationController(AppDbContext context){
        _context = context;
    }

    [HttpGet]
    public async Task<List<Location>> GetAllAsync()
    {
        return await _context.Locations
            .Include(x => x.Sensors)
            .ToListAsync();
    }

    [HttpGet("{id}", Name = "GetLocation")]
    public async Task<ActionResult<Location>> GetByIdAsync(int id){
        var location = await _context.Locations.FindAsync(id);

        if (location == null)
            return NotFound();

        return location;
    }
    [HttpPost]
    public async Task<ActionResult<Location>> CreateAsync(Location location){
        _context.Locations.Add(location);
        await _context.SaveChangesAsync();

        return CreatedAtRoute("GetLocation",new { id = location.Id },location);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsync(int id, Location location)
    {
        if (id != location.Id)
            return BadRequest();

        _context.Entry(location).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var location = await _context.Locations.FindAsync(id);

        if (location == null)
            return NotFound();

        _context.Locations.Remove(location);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}