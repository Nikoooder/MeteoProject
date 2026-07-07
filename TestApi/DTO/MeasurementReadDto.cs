namespace TestApi.DTO;
public class MeasurementReadDto
{
    public string Location { get; set; }
    public string Type { get; set; }
    public double Value { get; set; }
    public string Unit { get; set; }
    public DateTime Timestamp { get; set; }
}