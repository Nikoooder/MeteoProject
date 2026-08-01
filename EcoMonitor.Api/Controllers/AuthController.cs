using BCrypt.Net;
using EcoMonitor.Api.Data;
using EcoMonitor.Api.DTO;
using EcoMonitor.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoMonitor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest("Пользователь с таким Email уже существует.");
        }

        var user = new User
        {
            Username = request.UserName,
            Email = request.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok("Регистрация прошла успешно.");
    }
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            return Unauthorized("Неверный Email или пароль.");
        }

        bool isPasswordCorrect = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);

        if (!isPasswordCorrect)
        {
            return Unauthorized("Неверный Email или пароль.");
        }

        return Ok(new
        {
            Message = "Вход выполнен успешно.",
            User = new
            {
                user.Id,
                user.Username,
                user.Email
            }
        });
    }
}