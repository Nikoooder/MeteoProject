using EcoMonitor.Api.Data;
using EcoMonitor.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using EcoMonitor.Api.DTO;
using ClosedXML.Excel;
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

    [HttpGet("export")]
    public async Task<IActionResult> ExportAsync()
    {
        var locations = await _context.Locations.Where(l => l.UserId == CurrentUserId).ToListAsync();

        using var workbook = new XLWorkbook();

        var worksheet = workbook.Worksheets.Add("Locations");

        worksheet.Cell(1, 1).Value = "Name";
        worksheet.Cell(1, 2).Value = "Latitude";
        worksheet.Cell(1, 3).Value = "Longitude";

        int row = 2;

        foreach (var location in locations)
        {
            worksheet.Cell(row, 1).Value = location.Name;
            worksheet.Cell(row, 2).Value = location.Latitude;
            worksheet.Cell(row, 3).Value = location.Longitude;

            row++;
        }

        using var stream = new MemoryStream();

        workbook.SaveAs(stream);

        return File(stream.ToArray(),"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Locations.xlsx");
    }
    [HttpPost("import")]
    public async Task<IActionResult> ImportAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Файл не выбран.");

        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);

        var worksheet = workbook.Worksheet(1);

        var rows = worksheet.RowsUsed().Skip(1);

        foreach (var row in rows)
        {
            var location = new Location
            {
                Name = row.Cell(1).GetString(),
                Latitude = row.Cell(2).GetDouble(),
                Longitude = row.Cell(3).GetDouble(),
                UserId = CurrentUserId
            };

            _context.Locations.Add(location);
        }

        await _context.SaveChangesAsync();

        return Ok("Импорт завершен.");
    }
}