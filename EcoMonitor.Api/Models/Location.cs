namespace EcoMonitor.Api.Models;

public class Location
{
    public int Id { get; set; }
    public string Name { get; set; }=null!;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public DateTime CreationDate {get;set;}= DateTime.UtcNow;
    public int UserId { get; set; }

    public ICollection<Measurement> Measurements { get; set; } = new List<Measurement>();
}
