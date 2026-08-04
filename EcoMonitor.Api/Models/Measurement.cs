using System.ComponentModel.DataAnnotations;

namespace EcoMonitor.Api.Models;

public class Measurement
{
	public int Id{get;set;}
	public string CreationDate{get;set;}=null!;
	public int LocationId{get;set;}
	public int UserId{get;set;}
	
	[MaxLength(400)]
	public string Comment{get;set;}=string.Empty;
	public double? PM2_5 {get;set;} //PM2_5 is PM2.5
   	public double? PM10 {get;set;}
    	public double? CO {get;set;}
    	public double? NO {get;set;}
    	public double? SO {get;set;}
}

