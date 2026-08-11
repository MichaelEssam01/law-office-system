using LawOffice.Application.DTOs.Auth;

namespace LawOffice.Application.Interfaces.Services;

public interface IAuthService
{
    Task<TokenResultDto?> LoginAsync(LoginRequestDto loginRequest, string ipAddress, string deviceInfo);
    Task<TokenResultDto?> RefreshTokenAsync(string refreshToken, string ipAddress);
    Task<bool> RevokeTokenAsync(string refreshToken, string ipAddress);
    Task ForgotPasswordAsync(ForgotPasswordRequestDto forgotPasswordRequest, string ipAddress);
    Task<bool> ResetPasswordAsync(ResetPasswordRequestDto resetPasswordRequest, string ipAddress);
    Task LogoutAsync(string refreshToken, string ipAddress);
    Task<UserInfoDto?> GetUserInfoAsync(Guid userId);
}
