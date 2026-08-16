using EcoMonitor.Api.Data;
using EcoMonitor.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EcoMonitor.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SyncController : ControllerBase
{
    private readonly AppDbContext _context;

    public SyncController(AppDbContext context)
    {
        _context = context;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetChangesAsync(DateTime since)
    {
        var syncTime = DateTime.UtcNow;

        var changes = await _context.SyncQueues
            .Where(s => s.ChangeDate > since && s.ChangeDate <= syncTime)
            .OrderBy(s => s.ChangeDate)
            .ThenBy(s => s.Id)
            .ToListAsync();

        var latestChanges = changes
            .GroupBy(s => new { s.EntityType, s.EntityId })
            .Select(g => g.Last())
            .ToList();

        var locationIds = latestChanges
            .Where(s => s.EntityType == EntityType.Location && s.Operation != Operation.Delete)
            .Select(s => s.EntityId)
            .Distinct()
            .ToList();

        var measurementIds = latestChanges
            .Where(s => s.EntityType == EntityType.Measurement && s.Operation != Operation.Delete)
            .Select(s => s.EntityId)
            .Distinct()
            .ToList();

        var deletedLocationIds = latestChanges
            .Where(s => s.EntityType == EntityType.Location && s.Operation == Operation.Delete)
            .Select(s => s.EntityId)
            .Distinct()
            .ToList();

        var deletedMeasurementIds = latestChanges
            .Where(s => s.EntityType == EntityType.Measurement && s.Operation == Operation.Delete)
            .Select(s => s.EntityId)
            .Distinct()
            .ToList();

        var locations = await _context.Locations
            .Where(l => locationIds.Contains(l.Id) && l.UserId == CurrentUserId && l.DeletedAt == null)
            .Select(l => new
            {
                l.Id,
                l.ClientId,
                l.Name,
                l.Latitude,
                l.Longitude,
                l.CreationDate,
                l.UserId,
                l.UpdatedAt,
                l.DeletedAt
            })
            .ToListAsync();

        var measurements = await _context.Measurements
            .Where(m => measurementIds.Contains(m.Id) && m.CreatorId == CurrentUserId && m.DeletedAt == null)
            .Select(m => new
            {
                m.Id,
                m.ClientId,
                m.LocationId,
                m.CreatorId,
                m.Comment,
                m.SensorName,
                m.CreationDate,
                m.UpdatedAt,
                m.DeletedAt,
                m.O2,
                m.CO,
                m.SO2,
                m.NO,
                m.CH,
                m.CO2,
                m.NO2,
                m.H2CO,
                m.PM25,
                m.PM10,
                m.TVOC,
                m.WindSpeed,
                m.WindDirection,
                m.MeasurementTime,
                m.Humidity,
                m.AtmosphericPressure,
                m.Precipitation,
                m.PrecipitationPerHour,
                m.AirTemperature
            })
            .ToListAsync();

        var deletedLocations = await _context.Locations
            .Where(l => deletedLocationIds.Contains(l.Id) && l.UserId == CurrentUserId)
            .Select(l => new
            {
                l.Id,
                l.ClientId
            })
            .ToListAsync();

        var deletedMeasurements = await _context.Measurements
            .Where(m => deletedMeasurementIds.Contains(m.Id) && m.CreatorId == CurrentUserId)
            .Select(m => new
            {
                m.Id,
                m.ClientId
            })
            .ToListAsync();

        return Ok(new
        {
            syncTime,
            locations,
            measurements,
            deletedLocations,
            deletedMeasurements
        });
    }
}