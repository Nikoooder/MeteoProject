namespace EcoMonitor.Api.Models;

public class Measurement
{
	public int Id{get;set;}
	public string CreationDate{get;set;}
	public int LocationId{get;set;}
	public int CreatorId{get;set;}
	public int SensorId{get;set;}
	public double PM2_5 {get;set;}
   	public double PM10 {get;set;}
    	public double CO {get;set;}
    	public double NO {get;set;}
    	public double SO {get;set;}
}

