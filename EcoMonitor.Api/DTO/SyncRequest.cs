using EcoMonitor.Api.Models;

namespace EcoMonitor.Api.DTO;

public class SyncChangeRequest{
    public Guid ClientId { get; set; }
    public EntityType EntityType{get;set;}
    public int EntityId{get;set;}
    public Operation Operation{get;set;}
    public DateTime UpdatedAt{get;set;}
    public string? Name{get;set;}
    public double? Latitude{get;set;}
    public double? Longitude{get;set;}
    public string? Comment{get;set;}
    public string? SensorName{get;set;}
    public double? O2{get;set;}
    public double? CO{get;set;}
    public double? SO2{get;set;}
    public double? NO{get;set;}
    public double? CH{get;set;}
    public double? CO2{get;set;}
}

public class SyncPushRequest
{
    public List<SyncChangeRequest> Changes { get; set; } = new();
}
