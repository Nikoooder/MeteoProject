using Microsoft.AspNetCore.Mvc;
using TestApi.DTO;
using TestApi.Services;

namespace TestApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserService _service;

    public UsersController(UserService service)
    {
        _service = service;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(CreateUserDto dto)
    {
        var success = await _service.RegisterAsync(dto);

        if (!success)
        {
            return BadRequest("Пользователь уже существует.");
        }

        return Ok("Регистрация прошла успешно.");
    }
}