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
        // --- Локации -------------------------------------------------------
        var acceptedLocations = new List<Location>();
        var createdLocations = new List<Location>();
        var locationClientMap = new Dictionary<Guid, Location>();

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
                createdLocations.Add(location);
            }
            else if (location.UserId == CurrentUserId && (location.UpdatedAt ?? location.CreationDate) <= incomingTime)
            {
                location.Name = change.Name ?? location.Name;
                location.Latitude = change.Latitude ?? location.Latitude;
                location.Longitude = change.Longitude ?? location.Longitude;
                location.UpdatedAt = incomingTime;
                if (change.Operation == Operation.Delete)
                {
                    location.DeletedAt = incomingTime;

                    // Замеры удаляются вместе с локацией — актуально и для
                    // офлайн/ПВА-режима, когда удаление приходит через /Sync/push.
                    var locationMeasurements = await _context.Measurements
                        .Where(m => m.LocationId == location.Id && m.DeletedAt == null)
                        .ToListAsync();

                    foreach (var measurement in locationMeasurements)
                    {
                        measurement.DeletedAt = incomingTime;
                        measurement.UpdatedAt = incomingTime;
                        _context.SyncQueues.Add(new SyncQueue { EntityType = EntityType.Measurement, EntityId = measurement.Id, Operation = Operation.Delete });
                    }
                }
                _context.SyncQueues.Add(new SyncQueue { EntityType = EntityType.Location, EntityId = location.Id, Operation = change.Operation });
            }
            acceptedLocations.Add(location);
            locationClientMap[change.ClientId] = location;
        }

        // Сохраняем, чтобы у только что созданных локаций появился реальный Id —
        // он понадобится ниже при привязке замеров, созданных в той же самой пачке.
        await _context.SaveChangesAsync();
        foreach (var location in createdLocations)
            _context.SyncQueues.Add(new SyncQueue { EntityType = EntityType.Location, EntityId = location.Id, Operation = Operation.Create });

        // --- Замеры ----------------------------------------------------------
        var acceptedMeasurements = new List<Measurement>();
        var createdMeasurements = new List<Measurement>();

        foreach (var change in request.Changes.Where(c => c.EntityType == EntityType.Measurement))
        {
            var incomingTime = change.UpdatedAt.ToUniversalTime();
            var measurement = await _context.Measurements.FirstOrDefaultAsync(m => m.ClientId == change.ClientId);

            if (measurement == null)
            {
                if (change.Operation == Operation.Delete) continue;

                Location? location = null;
                if (change.LocationClientId.HasValue)
                {
                    location = locationClientMap.TryGetValue(change.LocationClientId.Value, out var mapped)
                        ? mapped
                        : await _context.Locations.FirstOrDefaultAsync(l => l.ClientId == change.LocationClientId.Value);
                }

                // Локация не найдена (например, её создание не прошло) или принадлежит
                // другому пользователю — замер молча пропускаем, ничего не ломая.
                if (location == null || location.UserId != CurrentUserId || location.DeletedAt != null) continue;

                measurement = new Measurement
                {
                    ClientId = change.ClientId,
                    LocationId = location.Id,
                    CreatorId = CurrentUserId,
                    Comment = change.Comment,
                    SensorName = change.SensorName ?? string.Empty,
                    O2 = change.O2,
                    CO = change.CO,
                    SO2 = change.SO2,
                    NO = change.NO,
                    CH = change.CH,
                    CO2 = change.CO2,
                    NO2 = change.NO2,
                    H2CO = change.H2CO,
                    PM25 = change.PM25,
                    PM10 = change.PM10,
                    TVOC = change.TVOC,
                    WindSpeed = change.WindSpeed,
                    WindDirection = change.WindDirection,
                    MeasurementTime = change.MeasurementTime,
                    Humidity = change.Humidity,
                    AtmosphericPressure = change.AtmosphericPressure,
                    Precipitation = change.Precipitation,
                    PrecipitationPerHour = change.PrecipitationPerHour,
                    AirTemperature = change.AirTemperature,
                    UpdatedAt = incomingTime
                };
                _context.Measurements.Add(measurement);
                createdMeasurements.Add(measurement);
            }
            else if (measurement.CreatorId == CurrentUserId && (measurement.UpdatedAt ?? measurement.CreationDate) <= incomingTime)
            {
                if (change.Operation == Operation.Delete)
                {
                    measurement.DeletedAt = incomingTime;
                }
                else
                {
                    measurement.Comment = change.Comment;
                    measurement.SensorName = change.SensorName ?? measurement.SensorName;
                    measurement.O2 = change.O2;
                    measurement.CO = change.CO;
                    measurement.SO2 = change.SO2;
                    measurement.NO = change.NO;
                    measurement.CH = change.CH;
                    measurement.CO2 = change.CO2;
                    measurement.NO2 = change.NO2;
                    measurement.H2CO = change.H2CO;
                    measurement.PM25 = change.PM25;
                    measurement.PM10 = change.PM10;
                    measurement.TVOC = change.TVOC;
                    measurement.WindSpeed = change.WindSpeed;
                    measurement.WindDirection = change.WindDirection;
                    measurement.MeasurementTime = change.MeasurementTime;
                    measurement.Humidity = change.Humidity;
                    measurement.AtmosphericPressure = change.AtmosphericPressure;
                    measurement.Precipitation = change.Precipitation;
                    measurement.PrecipitationPerHour = change.PrecipitationPerHour;
                    measurement.AirTemperature = change.AirTemperature;
                }
                measurement.UpdatedAt = incomingTime;
                _context.SyncQueues.Add(new SyncQueue { EntityType = EntityType.Measurement, EntityId = measurement.Id, Operation = change.Operation });
            }
            acceptedMeasurements.Add(measurement);
        }

        await _context.SaveChangesAsync();
        foreach (var measurement in createdMeasurements)
            _context.SyncQueues.Add(new SyncQueue { EntityType = EntityType.Measurement, EntityId = measurement.Id, Operation = Operation.Create });
        await _context.SaveChangesAsync();

        return Ok(new
        {
            locations = acceptedLocations.Where(l => l.DeletedAt == null).Select(l => new { l.Id, l.ClientId, l.Name, l.Latitude, l.Longitude, l.CreationDate, l.UserId, l.UpdatedAt }),
            measurements = acceptedMeasurements.Where(m => m.DeletedAt == null).Select(m => new
            {
                m.Id,
                m.ClientId,
                m.LocationId,
                m.CreatorId,
                m.Comment,
                m.SensorName,
                m.CreationDate,
                m.UpdatedAt,
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
        });
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
