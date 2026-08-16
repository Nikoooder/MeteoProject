namespace EcoMonitor.Api.DTO;
public class CreateMeasurementRequest
{
    public Guid ClientId { get; set; }
    public string SensorName { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public double? O2 { get; set; }
    public double? CO { get; set; }
    public double? SO2 { get; set; }
    public double? NO { get; set; }
    public double? CH { get; set; }
    public double? CO2 { get; set; }
    public double? NO2 { get; set; }
    public double? H2CO { get; set; }

    public double? PM25 { get; set; }
    public double? PM10 { get; set; }
    public double? TVOC { get; set; }

    public double? WindSpeed { get; set; }
    public string? WindDirection { get; set; }

    public DateTime? MeasurementTime { get; set; }

    public double? Humidity { get; set; }
    public double? AtmosphericPressure { get; set; }

    public double? Precipitation { get; set; }
    public double? PrecipitationPerHour { get; set; }

    public double? AirTemperature { get; set; }
}