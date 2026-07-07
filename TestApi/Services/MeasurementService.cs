using TestApi.DTO;
using TestApi.Models;
using TestApi.Repositories;

namespace TestApi.Services;

public class MeasurementService
{
    private readonly MeasurementRepository _repo;

    public MeasurementService(MeasurementRepository repo)
    {
        _repo = repo;
    }

    public async Task AddAsync(MeasurementCreateDto dto)
    {
        var entity = new Measurement
        {
            Location = dto.Location,
            Type = dto.Type,
            Value = dto.Value,
            Unit = dto.Unit,
            Timestamp = DateTime.UtcNow
        };

        await _repo.AddAsync(entity);
    }

    public async Task<double> GetAverageAsync(string type, string location)
    {
        var data = await _repo.GetByTypeAndLocation(type, location);
        return data.Average(x => x.Value);
    }

    public async Task<List<Measurement>> GetAllAsync()
    {
        return await _repo.GetAll();
    }
}