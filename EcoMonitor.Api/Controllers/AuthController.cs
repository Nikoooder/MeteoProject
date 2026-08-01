using BCrypt.Net;
using EcoMonitor.Api.Data;
using EcoMonitor.Api.DTO;
using EcoMonitor.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcoMonitor.Api.Services;
using Microsoft.AspNetCore.Authorization;
namespace EcoMonitor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    private readonly JwtService _jwtService;

    public AuthController(AppDbContext context, JwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
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
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
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

        bool isPasswordCorrect = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!isPasswordCorrect)
        {
            return Unauthorized("Неверный Email или пароль.");
        }
        var token = _jwtService.GenerateToken(user);
        return Ok(new
        {
            Token = token,
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