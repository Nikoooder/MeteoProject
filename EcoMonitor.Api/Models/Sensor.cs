namespace EcoMonitor.Api.Models;

public class Sensor
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int LocationId { get; set; }
    public ICollection<Measurement> Measurements{get;set;} = new List<Measurement>();
}
