namespace TestApi.Models;
public class Measurement
{
    public int Id { get; set; }
    public string Location { get; set; }
    public string Type { get; set; } // air, water, noise
    public double Value { get; set; }
    public string Unit { get; set; }
    public DateTime Timestamp { get; set; }
}