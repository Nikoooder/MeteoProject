using TestApi.DTO;
using TestApi.Models;
using TestApi.Repositories;

namespace TestApi.Services;

public class UserService
{
    private readonly UserRepository _repository;

    public UserService(UserRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> RegisterAsync(CreateUserDto dto)
    {
        var existingUser = await _repository.GetByEmailAsync(dto.Email);

        if (existingUser != null)
        {
            return false;
        }

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = dto.Password
        };

        await _repository.AddAsync(user);

        return true;
    }
}