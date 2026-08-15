using System.ComponentModel.DataAnnotations;

namespace EcoMonitor.Api.Models;


public enum EntityType{//Changable only
	Location,
	Measurement
}	

public enum Operation{//Changebale only
	Create,
	Change,
	Delete
}


public class SyncQueue{
	public int Id {get;set;}
	public EntityType EntityType{get;set;}
	public int EntityId{get;set;}
	public Operation Operation{get;set;}
	public DateTime ChangeDate{get;set;}=DateTime.UtcNow;
}
