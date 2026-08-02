namespace EcoMonitor.Api.DTO;

public class UpdateLocationRequest
{
    public string Name { get; set; } = "";

    public double Latitude { get; set; }

    public double Longitude { get; set; }
}