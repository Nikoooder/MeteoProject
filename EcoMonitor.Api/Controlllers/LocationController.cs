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
    public async Task<ActionResult<Location>> CreateAsync(CreateLocationRequest request)
    {
        var location = new Location
        {
            Name = request.Name,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            UserId = CurrentUserId
        };

        _context.Locations.Add(location);

        await _context.SaveChangesAsync();

        if (request.Measurement != null)
        {
            var measurement = new Measurement
            {
                LocationId = location.Id,

                O2 = request.Measurement.O2,
                CO = request.Measurement.CO,
                SO2 = request.Measurement.SO2,
                NO = request.Measurement.NO,
                CH = request.Measurement.CH,
                CO2 = request.Measurement.CO2,
                NO2 = request.Measurement.NO2,
                H2CO = request.Measurement.H2CO,

                PM25 = request.Measurement.PM25,
                PM10 = request.Measurement.PM10,
                TVOC = request.Measurement.TVOC,

                WindSpeed = request.Measurement.WindSpeed,
                WindDirection = request.Measurement.WindDirection,

                MeasurementTime = request.Measurement.MeasurementTime,

                Humidity = request.Measurement.Humidity,
                AtmosphericPressure = request.Measurement.AtmosphericPressure,

                Precipitation = request.Measurement.Precipitation,
                PrecipitationPerHour = request.Measurement.PrecipitationPerHour,

                AirTemperature = request.Measurement.AirTemperature
            };

            _context.Measurements.Add(measurement);

            await _context.SaveChangesAsync();
        }

        return Ok(location);
    }

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


    [HttpGet("{id}/export")]
    public async Task<IActionResult> ExportAsync(int id)
    {
        var location = await _context.Locations
            .Include(l => l.Measurements)
            .FirstOrDefaultAsync(l =>
                l.Id == id &&
                l.UserId == CurrentUserId);

        if (location == null)
            return NotFound();

        using var workbook = new XLWorkbook();

        var worksheet = workbook.Worksheets.Add("Location");

        // Информация о Location
        worksheet.Cell(1, 1).Value = "Location";
        worksheet.Cell(2, 1).Value = "Name";
        worksheet.Cell(2, 2).Value = location.Name;

        worksheet.Cell(3, 1).Value = "Latitude";
        worksheet.Cell(3, 2).Value = location.Latitude;

        worksheet.Cell(4, 1).Value = "Longitude";
        worksheet.Cell(4, 2).Value = location.Longitude;


        // Таблица Measurements
        int headerRow = 7;

        worksheet.Cell(headerRow, 1).Value = "O2";
        worksheet.Cell(headerRow, 2).Value = "CO";
        worksheet.Cell(headerRow, 3).Value = "SO2";
        worksheet.Cell(headerRow, 4).Value = "NO";
        worksheet.Cell(headerRow, 5).Value = "CH";
        worksheet.Cell(headerRow, 6).Value = "CO2";
        worksheet.Cell(headerRow, 7).Value = "NO2";
        worksheet.Cell(headerRow, 8).Value = "H2CO";
        worksheet.Cell(headerRow, 9).Value = "PM25";
        worksheet.Cell(headerRow, 10).Value = "PM10";
        worksheet.Cell(headerRow, 11).Value = "TVOC";
        worksheet.Cell(headerRow, 12).Value = "WindSpeed";
        worksheet.Cell(headerRow, 13).Value = "WindDirection";
        worksheet.Cell(headerRow, 14).Value = "MeasurementTime";
        worksheet.Cell(headerRow, 15).Value = "Humidity";
        worksheet.Cell(headerRow, 16).Value = "AtmosphericPressure";
        worksheet.Cell(headerRow, 17).Value = "Precipitation";
        worksheet.Cell(headerRow, 18).Value = "PrecipitationPerHour";
        worksheet.Cell(headerRow, 19).Value = "AirTemperature";


        int row = headerRow + 1;

        foreach (var measurement in location.Measurements)
        {
            worksheet.Cell(row, 1).Value = measurement.O2;
            worksheet.Cell(row, 2).Value = measurement.CO;
            worksheet.Cell(row, 3).Value = measurement.SO2;
            worksheet.Cell(row, 4).Value = measurement.NO;
            worksheet.Cell(row, 5).Value = measurement.CH;
            worksheet.Cell(row, 6).Value = measurement.CO2;
            worksheet.Cell(row, 7).Value = measurement.NO2;
            worksheet.Cell(row, 8).Value = measurement.H2CO;
            worksheet.Cell(row, 9).Value = measurement.PM25;
            worksheet.Cell(row, 10).Value = measurement.PM10;
            worksheet.Cell(row, 11).Value = measurement.TVOC;
            worksheet.Cell(row, 12).Value = measurement.WindSpeed;
            worksheet.Cell(row, 13).Value = measurement.WindDirection;
            worksheet.Cell(row, 14).Value = measurement.MeasurementTime;
            worksheet.Cell(row, 15).Value = measurement.Humidity;
            worksheet.Cell(row, 16).Value = measurement.AtmosphericPressure;
            worksheet.Cell(row, 17).Value = measurement.Precipitation;
            worksheet.Cell(row, 18).Value = measurement.PrecipitationPerHour;
            worksheet.Cell(row, 19).Value = measurement.AirTemperature;

            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();

        workbook.SaveAs(stream);

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"{location.Name}.xlsx");
    }
    [HttpPost("import")]
    public async Task<IActionResult> ImportAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is empty.");

        if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Only .xlsx files are supported.");

        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);

        var worksheet = workbook.Worksheet("Location");

        // =========================
        // LOCATION
        // =========================

        var name = worksheet.Cell(2, 2).GetValue<string>();
        var latitude = worksheet.Cell(3, 2).GetValue<double>();
        var longitude = worksheet.Cell(4, 2).GetValue<double>();

        if (string.IsNullOrWhiteSpace(name))
            return BadRequest("Location name is empty.");

        // Ищем существующую Location
        var location = await _context.Locations
            .FirstOrDefaultAsync(l =>
                l.UserId == CurrentUserId &&
                l.Name == name &&
                l.Latitude == latitude &&
                l.Longitude == longitude);

        // Если Location не существует — создаём
        if (location == null)
        {
            location = new Location
            {
                Name = name,
                Latitude = latitude,
                Longitude = longitude,
                UserId = CurrentUserId
            };

            _context.Locations.Add(location);

            // Получаем Id новой Location
            await _context.SaveChangesAsync();
        }

        // =========================
        // MEASUREMENTS
        // =========================

        int row = 8;
        int measurementsCount = 0;

        while (!worksheet.Cell(row, 1).IsEmpty())
        {
            // Excel возвращает DateTime с Kind = Unspecified.
            // PostgreSQL timestamp with time zone требует UTC.
            var measurementTime = worksheet
                .Cell(row, 14)
                .GetValue<DateTime?>();

            if (measurementTime.HasValue)
            {
                measurementTime = DateTime.SpecifyKind(
                    measurementTime.Value,
                    DateTimeKind.Utc);
            }

            var measurement = new Measurement
            {
                LocationId = location.Id,
                CreatorId = CurrentUserId,
                CreationDate = DateTime.UtcNow,

                O2 = worksheet.Cell(row, 1).GetValue<double?>(),
                CO = worksheet.Cell(row, 2).GetValue<double?>(),
                SO2 = worksheet.Cell(row, 3).GetValue<double?>(),
                NO = worksheet.Cell(row, 4).GetValue<double?>(),
                CH = worksheet.Cell(row, 5).GetValue<double?>(),
                CO2 = worksheet.Cell(row, 6).GetValue<double?>(),
                NO2 = worksheet.Cell(row, 7).GetValue<double?>(),
                H2CO = worksheet.Cell(row, 8).GetValue<double?>(),

                PM25 = worksheet.Cell(row, 9).GetValue<double?>(),
                PM10 = worksheet.Cell(row, 10).GetValue<double?>(),
                TVOC = worksheet.Cell(row, 11).GetValue<double?>(),

                WindSpeed = worksheet.Cell(row, 12).GetValue<double?>(),
                WindDirection = worksheet.Cell(row, 13).GetValue<string>(),

                MeasurementTime = measurementTime,

                Humidity = worksheet.Cell(row, 15).GetValue<double?>(),
                AtmosphericPressure = worksheet.Cell(row, 16).GetValue<double?>(),

                Precipitation = worksheet.Cell(row, 17).GetValue<double?>(),
                PrecipitationPerHour = worksheet.Cell(row, 18).GetValue<double?>(),

                AirTemperature = worksheet.Cell(row, 19).GetValue<double?>()
            };

            _context.Measurements.Add(measurement);

            measurementsCount++;
            row++;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Import completed successfully.",
            locationId = location.Id,
            locationName = location.Name,
            measurementsCount
        });
    }
}