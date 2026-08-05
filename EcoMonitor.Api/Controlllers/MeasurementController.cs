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
    public async Task<ActionResult<Measurement>> CreateMeasurementAsync(
    int locationId,
    CreateMeasurementRequest request)
{
    var location = await _context.Locations
        .FindAsync(locationId);

    if (location == null)
        return NotFound("Location not found");

    var measurement = new Measurement
    {
        LocationId = locationId,

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
}