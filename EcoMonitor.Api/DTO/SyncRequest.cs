using EcoMonitor.Api.Models;

namespace EcoMonitor.Api.DTO;

public class SyncChangeRequest{
    public Guid ClientId { get; set; }
    public EntityType EntityType{get;set;}
    public int EntityId{get;set;}
    public Operation Operation{get;set;}
    public DateTime UpdatedAt{get;set;}

    // Location fields
    public string? Name{get;set;}
    public double? Latitude{get;set;}
    public double? Longitude{get;set;}

    // Measurement fields — LocationClientId lets a measurement be linked to a
    // location that may itself still be pending in the very same push batch.
    public Guid? LocationClientId{get;set;}
    public string? Comment{get;set;}
    public string? SensorName{get;set;}
    public double? O2{get;set;}
    public double? CO{get;set;}
    public double? SO2{get;set;}
    public double? NO{get;set;}
    public double? CH{get;set;}
    public double? CO2{get;set;}
    public double? NO2{get;set;}
    public double? H2CO{get;set;}
    public double? PM25{get;set;}
    public double? PM10{get;set;}
    public double? TVOC{get;set;}
    public double? WindSpeed{get;set;}
    public string? WindDirection{get;set;}
    public DateTime? MeasurementTime{get;set;}
    public double? Humidity{get;set;}
    public double? AtmosphericPressure{get;set;}
    public double? Precipitation{get;set;}
    public double? PrecipitationPerHour{get;set;}
    public double? AirTemperature{get;set;}
}

public class SyncPushRequest
{
    public List<SyncChangeRequest> Changes { get; set; } = new();
}
