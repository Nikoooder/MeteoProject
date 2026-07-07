using Microsoft.AspNetCore.Mvc;
using TestApi.DTO;
using TestApi.Services;

namespace TestApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MeasurementsController : ControllerBase
{
    private readonly MeasurementService _service;

    public MeasurementsController(MeasurementService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Create(MeasurementCreateDto dto)
    {
        await _service.AddAsync(dto);
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("average")]
    public async Task<IActionResult> GetAverage(string type, string location)
    {
        var result = await _service.GetAverageAsync(type, location);
        return Ok(result);
    }
}