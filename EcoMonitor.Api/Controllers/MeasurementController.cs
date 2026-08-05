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
public class MeasurementController :ControllerBase{
    private readonly AppDbContext _context;
    public MeasurementController(AppDbContext context){
        _context = context;
    }
    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("{locationId}/measurements")]
    public async Task<ActionResult<Measurement>> CreateMeasurementAsync(int locationId,CreateMeasurementRequest request){
    var location = await _context.Locations
        .FindAsync(locationId);

    if (location == null)
        return NotFound("Location not found");

    var measurement = new Measurement
    {
        LocationId = locationId,
        CreatorId = CurrentUserId,
        CreationDate = DateTime.UtcNow,


        Comment = request.Comment,
        SensorName = request.SensorName,
        O2 = request.O2,
        CO = request.CO,
        SO2 = request.SO2,
        NO = request.NO,
        CH = request.CH,
        CO2 = request.CO2,
        NO2 = request.NO2,
        H2CO = request.H2CO,
        PM25 = request.PM25,
        PM10 = request.PM10,
        TVOC = request.TVOC,
        WindSpeed = request.WindSpeed,
        WindDirection = request.WindDirection,
        MeasurementTime = request.MeasurementTime,
        Humidity = request.Humidity,
        AtmosphericPressure = request.AtmosphericPressure,
        Precipitation = request.Precipitation,
        PrecipitationPerHour = request.PrecipitationPerHour,
        AirTemperature = request.AirTemperature
    };

    _context.Measurements.Add(measurement);
    await _context.SaveChangesAsync();

    return Ok(measurement);
    }
    [HttpPut("{id}")]
    public async Task<ActionResult<Measurement>> UpdateMeasurementAsync(int id,CreateMeasurementRequest request){
        var measurement = await _context.Measurements
            .FirstOrDefaultAsync(m => m.Id == id);

        if (measurement == null)
            return NotFound("Measurement not found");

        var location = await _context.Locations
            .FirstOrDefaultAsync(l =>
                l.Id == measurement.LocationId &&
                l.UserId == CurrentUserId);

        if (location == null)
            return NotFound("Measurement not found");

        measurement.Comment = request.Comment;
        measurement.SensorName = request.SensorName;

        measurement.O2 = request.O2;
        measurement.CO = request.CO;
        measurement.SO2 = request.SO2;
        measurement.NO = request.NO;
        measurement.CH = request.CH;
        measurement.CO2 = request.CO2;
        measurement.NO2 = request.NO2;
        measurement.H2CO = request.H2CO;

        measurement.PM25 = request.PM25;
        measurement.PM10 = request.PM10;
        measurement.TVOC = request.TVOC;

        measurement.WindSpeed = request.WindSpeed;
        measurement.WindDirection = request.WindDirection;

        measurement.MeasurementTime = request.MeasurementTime;

        measurement.Humidity = request.Humidity;
        measurement.AtmosphericPressure = request.AtmosphericPressure;

        measurement.Precipitation = request.Precipitation;
        measurement.PrecipitationPerHour = request.PrecipitationPerHour;

        measurement.AirTemperature = request.AirTemperature;

        await _context.SaveChangesAsync();

        return Ok(measurement);
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMeasurementAsync(int id)
    {
        var measurement = await _context.Measurements
            .FirstOrDefaultAsync(m => m.Id == id);

        if (measurement == null)
            return NotFound("Measurement not found");

        var location = await _context.Locations
            .FirstOrDefaultAsync(l =>
                l.Id == measurement.LocationId &&
                l.UserId == CurrentUserId);

        if (location == null)
            return NotFound("Measurement not found");

        _context.Measurements.Remove(measurement);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}