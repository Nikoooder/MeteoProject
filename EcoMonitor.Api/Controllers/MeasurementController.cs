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
    var location = await _context.Locations.FindAsync(locationId);

    if (location == null)
        return NotFound("Location not found");

    // ----------------------------------------------------------------------
    // Поведение по умолчанию: добавлять замеры к локации может только
    // пользователь, который её создал.
    // ----------------------------------------------------------------------
    if (location.UserId != CurrentUserId)
        return Forbid();

    // ----------------------------------------------------------------------
    // АЛЬТЕРНАТИВНОЕ ПОВЕДЕНИЕ (закомментировано):
    // разрешить добавлять замеры к ЛЮБОЙ локации ВСЕМ авторизованным
    // пользователям, а не только её создателю.
    // Чтобы включить: закомментируйте блок проверки выше
    // (if (location.UserId != CurrentUserId) return Forbid();)
    // и раскомментируйте условие ниже — оно оставлено пустым специально,
    // т.к. в этом режиме дополнительных проверок владельца не требуется.
    //
    // if (location == null) { /* локация уже проверена выше */ }
    // ----------------------------------------------------------------------

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
        var measurement = await _context.Measurements.FirstOrDefaultAsync(m => m.Id == id);

        if (measurement == null)
            return NotFound("Measurement not found");

        var location = await _context.Locations.FirstOrDefaultAsync(l =>l.Id == measurement.LocationId &&l.UserId == CurrentUserId);

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
        var measurement = await _context.Measurements.FirstOrDefaultAsync(m => m.Id == id);

        if (measurement == null)
            return NotFound("Measurement not found");

        var location = await _context.Locations.FirstOrDefaultAsync(l =>l.Id == measurement.LocationId &&l.UserId == CurrentUserId);

        if (location == null)
            return NotFound("Measurement not found");

        _context.Measurements.Remove(measurement);

        await _context.SaveChangesAsync();

        return NoContent();
    }
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<MeasurementResponse>>> GetAllAsync()
    {
        var measurements = await _context.Measurements
            .Select(m => new MeasurementResponse
            {
                Id = m.Id,
                LocationId = m.LocationId,
                SensorName = m.SensorName,
                Comment = m.Comment,

                O2 = m.O2,
                CO = m.CO,
                SO2 = m.SO2,
                NO = m.NO,
                CH = m.CH,
                CO2 = m.CO2,
                NO2 = m.NO2,
                H2CO = m.H2CO,

                PM25 = m.PM25,
                PM10 = m.PM10,
                TVOC = m.TVOC,

                WindSpeed = m.WindSpeed,
                WindDirection = m.WindDirection,

                CreationDate = m.CreationDate,
                MeasurementTime = m.MeasurementTime,

                Humidity = m.Humidity,
                AtmosphericPressure = m.AtmosphericPressure,

                Precipitation = m.Precipitation,
                PrecipitationPerHour = m.PrecipitationPerHour,

                AirTemperature = m.AirTemperature
            })
            .ToListAsync();

        return Ok(measurements);
    }
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<MeasurementResponse>> GetByIdAsync(int id)
    {
        var measurement = await _context.Measurements
            .Where(m => m.Id == id)
            .Select(m => new MeasurementResponse
            {
                Id = m.Id,
                LocationId = m.LocationId,
                SensorName = m.SensorName,
                Comment = m.Comment,

                O2 = m.O2,
                CO = m.CO,
                SO2 = m.SO2,
                NO = m.NO,
                CH = m.CH,
                CO2 = m.CO2,
                NO2 = m.NO2,
                H2CO = m.H2CO,

                PM25 = m.PM25,
                PM10 = m.PM10,
                TVOC = m.TVOC,

                WindSpeed = m.WindSpeed,
                WindDirection = m.WindDirection,

                CreationDate = m.CreationDate,
                MeasurementTime = m.MeasurementTime,

                Humidity = m.Humidity,
                AtmosphericPressure = m.AtmosphericPressure,

                Precipitation = m.Precipitation,
                PrecipitationPerHour = m.PrecipitationPerHour,

                AirTemperature = m.AirTemperature
            })
            .FirstOrDefaultAsync();

        if (measurement == null)
            return NotFound();

        return Ok(measurement);
    }
    [HttpGet("location/{locationId}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<MeasurementResponse>>> GetByLocationAsync(
        int locationId)
    {
        var measurements = await _context.Measurements
            .Where(m => m.LocationId == locationId)
            .Select(m => new MeasurementResponse
            {
                Id = m.Id,
                LocationId = m.LocationId,
                SensorName = m.SensorName,
                Comment = m.Comment,

                O2 = m.O2,
                CO = m.CO,
                SO2 = m.SO2,
                NO = m.NO,
                CH = m.CH,
                CO2 = m.CO2,
                NO2 = m.NO2,
                H2CO = m.H2CO,

                PM25 = m.PM25,
                PM10 = m.PM10,
                TVOC = m.TVOC,

                WindSpeed = m.WindSpeed,
                WindDirection = m.WindDirection,

                CreationDate = m.CreationDate,
                MeasurementTime = m.MeasurementTime,

                Humidity = m.Humidity,
                AtmosphericPressure = m.AtmosphericPressure,

                Precipitation = m.Precipitation,
                PrecipitationPerHour = m.PrecipitationPerHour,

                AirTemperature = m.AirTemperature
            })
            .ToListAsync();

        return Ok(measurements);
    }
}