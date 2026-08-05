using System.ComponentModel.DataAnnotations;

namespace EcoMonitor.Api.Models;

public class Measurement
{
	public int Id{get;set;}
	public DateTime CreationDate{ get; set; } = DateTime.UtcNow;
	public int LocationId{get;set;}

	public int CreatorId{get;set;}
	public double? O2 { get; set; }

    public double? CO { get; set; }

    public double? SO2 { get; set; }

    public double? NO { get; set; }

    public double? CH { get; set; }

    public double? CO2 { get; set; }

    public double? NO2 { get; set; }

    public double? H2CO { get; set; }

    // Взвешенные частицы
    public double? PM25 { get; set; }

    public double? PM10 { get; set; }

    public double? TVOC { get; set; }

    // Погодные параметры
    public double? WindSpeed { get; set; }

    public string? WindDirection { get; set; }

    public DateTime? MeasurementTime { get; set; }

    public double? Humidity { get; set; }

    public double? AtmosphericPressure { get; set; }

    // Осадки
	public double? Precipitation { get; set; }          // мм
	public double? PrecipitationPerHour { get; set; }   // мм/ч

    public double? AirTemperature { get; set; }

}

