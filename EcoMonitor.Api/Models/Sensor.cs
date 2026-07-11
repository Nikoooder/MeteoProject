namespace EcoMonitor.Api.Models;

public class Sensor{
	public int Id{get;set;}
	public string Name{get;set;}
	public int LocationId{get;set;}
	public Location Locations{get;set;}
}
