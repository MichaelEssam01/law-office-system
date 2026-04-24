using LawOffice.Application.DTOs.Auth;

namespace LawOffice.Application.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto loginRequest);
}
