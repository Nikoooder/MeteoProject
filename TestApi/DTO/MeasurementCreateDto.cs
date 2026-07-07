namespace TestApi.DTO;
public class MeasurementCreateDto
{
    public string Location { get; set; }
    public string Type { get; set; }
    public double Value { get; set; }
    public string Unit { get; set; }
}