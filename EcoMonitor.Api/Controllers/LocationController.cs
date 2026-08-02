using EcoMonitor.Api.Data;
using EcoMonitor.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using EcoMonitor.Api.DTO;
namespace EcoMonitor.Api.Controllers;
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LocationController:ControllerBase{
    private readonly AppDbContext _context;
    public LocationController(AppDbContext context){
        _context = context;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet]
    public async Task<List<Location>> GetAllAsync()
    {
        return await _context.Locations.Where(l => l.UserId == CurrentUserId).ToListAsync();
    }


    [HttpGet("{id}", Name = "GetLocation")]
    public async Task<ActionResult<Location>> GetByIdAsync(int id){
        var location = await _context.Locations.FirstOrDefaultAsync(l =>l.Id == id &&l.UserId == CurrentUserId);

        if (location == null)
            return NotFound();

        return location;
    }

    [HttpPost]
    public async Task<ActionResult<Location>> CreateAsync(CreateLocationRequest request){
        var location = new Location
        {
            Name = request.Name,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            UserId = CurrentUserId
        };

        _context.Locations.Add(location);

        await _context.SaveChangesAsync();

        return Ok(location);
    }
    /* [HttpPut("{id}")] // ���������� put
    public async Task<IActionResult> UpdateAsync(int id, Location location)
    {
        if (id != location.Id)
            return BadRequest();


        var existingLocation = await _context.Locations
            .Include(x => x.Sensors)
            .FirstOrDefaultAsync(x => x.Id == id);


        if (existingLocation == null)
            return NotFound();


        // ��������� ������ �������
        existingLocation.Name = location.Name;
        existingLocation.Latitude = location.Latitude;
        existingLocation.Longitude = location.Longitude;


        // ������� �������, ������� ������ ���
        var sensorsToDelete = existingLocation.Sensors
            .Where(oldSensor =>
                !location.Sensors.Any(
                    newSensor => newSensor.Id == oldSensor.Id
                )
            )
            .ToList();


        foreach (var sensor in sensorsToDelete)
        {
            _context.Sensors.Remove(sensor);
        }


        // ��������� ����� � ��������� ������������
        foreach (var sensor in location.Sensors)
        {
            var existingSensor = existingLocation.Sensors
                .FirstOrDefault(x => x.Id == sensor.Id);


            if (existingSensor == null)
            {
                existingLocation.Sensors.Add(new Sensor
                {
                    Name = sensor.Name
                });
            }
            else
            {
                existingSensor.Name = sensor.Name;
            }
        }


        await _context.SaveChangesAsync();


        return NoContent();
    } */


    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsync(int id, UpdateLocationRequest request)
    {
        var location = await _context.Locations
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == CurrentUserId);

        if (location == null)
            return NotFound();

        location.Name = request.Name;
        location.Latitude = request.Latitude;
        location.Longitude = request.Longitude;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var location = await _context.Locations.FirstOrDefaultAsync(l =>l.Id == id &&l.UserId == CurrentUserId);

        if (location == null)
            return NotFound();

        _context.Locations.Remove(location);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}