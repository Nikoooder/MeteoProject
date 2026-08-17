using EcoMonitor.Api.Data;
using EcoMonitor.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EcoMonitor.Api.DTO;

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

    // The client keeps mutations in IndexedDB.  The newest UpdatedAt wins,
    // which makes reconnecting several devices deterministic.
    [HttpPost("push")]
    public async Task<IActionResult> PushAsync(SyncPushRequest request)
    {
        var accepted = new List<Location>();
        var created = new List<Location>();
        foreach (var change in request.Changes.Where(c => c.EntityType == EntityType.Location))
        {
            var incomingTime = change.UpdatedAt.ToUniversalTime();
            var location = await _context.Locations.FirstOrDefaultAsync(l => l.ClientId == change.ClientId);
            if (location == null)
            {
                if (change.Operation == Operation.Delete) continue;
                location = new Location
                {
                    ClientId = change.ClientId,
                    Name = change.Name ?? "Без названия",
                    Latitude = change.Latitude ?? 0,
                    Longitude = change.Longitude ?? 0,
                    UserId = CurrentUserId,
                    UpdatedAt = incomingTime
                };
                _context.Locations.Add(location);
                created.Add(location);
            }
            else if (location.UserId == CurrentUserId && (location.UpdatedAt ?? location.CreationDate) <= incomingTime)
            {
                location.Name = change.Name ?? location.Name;
                location.Latitude = change.Latitude ?? location.Latitude;
                location.Longitude = change.Longitude ?? location.Longitude;
                location.UpdatedAt = incomingTime;
                if (change.Operation == Operation.Delete) location.DeletedAt = incomingTime;
                _context.SyncQueues.Add(new SyncQueue { EntityType = EntityType.Location, EntityId = location.Id, Operation = change.Operation });
            }
            accepted.Add(location);
        }
        await _context.SaveChangesAsync();
        foreach (var location in created)
            _context.SyncQueues.Add(new SyncQueue { EntityType = EntityType.Location, EntityId = location.Id, Operation = Operation.Create });
        await _context.SaveChangesAsync();
        return Ok(new { locations = accepted.Where(l => l.DeletedAt == null).Select(l => new { l.Id, l.ClientId, l.Name, l.Latitude, l.Longitude, l.CreationDate, l.UserId, l.UpdatedAt }) });
    }

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
