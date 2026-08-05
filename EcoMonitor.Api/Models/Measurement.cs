using System.ComponentModel.DataAnnotations;

namespace EcoMonitor.Api.Models;

public class Measurement
{
	public int Id{get;set;}
	public DateTime CreationDate{ get; set; } = DateTime.UtcNow;
	public int LocationId{get;set;}

	public int CreatorId{get;set;}
	[MaxLength(400)]
	public string Comment{get;set;} = string.Empty;
	public string SensorName{get;set;} = null!;

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
    	public double? Precipitation { get; set; }          // mm 
    	public double? PrecipitationPerHour { get; set; }   // mm/h
    	public double? AirTemperature { get; set; }

}

