namespace EcoMonitor.Api.Models;

public class Location
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    //public ICollection<Sensor> Sensors { get; set; } = new List<Sensor>();
}