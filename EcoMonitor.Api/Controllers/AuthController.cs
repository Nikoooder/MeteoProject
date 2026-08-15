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
public class AuthController : ControllerBase{
    private readonly AppDbContext _context;

    private readonly JwtService _jwtService;

    public AuthController(AppDbContext context, JwtService jwtService){
        _context = context;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterRequest request){
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest("Email cannot be empty.");

        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Password cannot be empty.");

        if (string.IsNullOrWhiteSpace(request.Username))
            return BadRequest("Username cannot be empty.");

        if (!new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(request.Email)){
            return BadRequest("Invalid email format.");
        }
        var email = request.Email.Trim();

        var existingUser = await _context.Users.AnyAsync(u => u.Email == email);

        if (existingUser){
            return BadRequest("User with this email already exists.");
        }

        var user = new User{
            Username = request.Username.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        return Ok("Registration successful.");
    }
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest("Email cannot be empty.");

        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Password cannot be empty.");

        var email = request.Email.Trim();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
            return Unauthorized("Invalid email or password.");

        var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!passwordValid)
            return Unauthorized("Invalid email or password.");

        var token = _jwtService.GenerateToken(user);

        return Ok(new{
            Token = token,
            Message = "Authorization successfull.",
            User = new
            {
                user.Id,
                user.Username,
                user.Email
            }
        });
    }
}