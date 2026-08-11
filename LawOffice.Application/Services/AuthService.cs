using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LawOffice.Application.Common.Security;
using LawOffice.Application.Common.Settings;
using LawOffice.Application.DTOs.Auth;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using LawOffice.Application.Interfaces.Repositories;

using LawOffice.Application.Common.Exceptions;

namespace LawOffice.Application.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly JwtSettings _jwtSettings;
    private readonly IEmailService _emailService;
    private readonly AppSettings _appSettings;
    private readonly IDistributedCache _cache;
    private readonly ILogger<AuthService> _logger;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditService _auditService;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly IUserProfileService _profileService;

    public AuthService(
        UserManager<User> userManager, 
        RoleManager<IdentityRole<Guid>> roleManager,
        IOptions<JwtSettings> jwtSettings, 
        IEmailService emailService,
        IOptions<AppSettings> appSettings,
        IDistributedCache cache,
        ILogger<AuthService> logger,
        IUnitOfWork unitOfWork,
        IAuditService auditService,
        IUserProfileService profileService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _jwtSettings = jwtSettings.Value;
        _emailService = emailService;
        _appSettings = appSettings.Value;
        _cache = cache;
        _logger = logger;
        _unitOfWork = unitOfWork;
        _auditService = auditService;
        _profileService = profileService;
    }

    public async Task<TokenResultDto?> LoginAsync(LoginRequestDto loginRequest, string ipAddress, string deviceInfo)
    {
        var user = await _userManager.FindByEmailAsync(loginRequest.Email);

        if (user == null)
        {
            _logger.LogWarning("Failed login attempt: User not found for email: {Email}", loginRequest.Email);
            await _auditService.LogAsync("LoginFailed", "User", null, null, $"{{\"email\": \"{loginRequest.Email}\"}}", ipAddress, deviceInfo);
            return null;
        }

        // 1. Check if account is already locked out
        if (await _userManager.IsLockedOutAsync(user))
        {
            _logger.LogWarning("Failed login attempt: Account locked for email: {Email}", loginRequest.Email);
            await _auditService.LogAsync("AccountLockout", "User", user.Id.ToString(), user.Id, null, ipAddress, deviceInfo);
            throw new AccountLockedException();
        }

        // 2. Validate password
        if (!await _userManager.CheckPasswordAsync(user, loginRequest.Password))
        {
            // 3. Increment failed access count
            await _userManager.AccessFailedAsync(user);
            
            _logger.LogWarning("Failed login attempt: Invalid password for email: {Email} from IP: {IP}", loginRequest.Email, ipAddress);

            // 4. Re-check if this attempt caused a lockout
            if (await _userManager.IsLockedOutAsync(user))
            {
                _logger.LogWarning("Account locked after failed attempt for email: {Email}", loginRequest.Email);
                await _auditService.LogAsync("AccountLockout", "User", user.Id.ToString(), user.Id, "Lockout triggered by failed password", ipAddress, deviceInfo);
                throw new AccountLockedException();
            }

            await _auditService.LogAsync("LoginFailed", "User", user.Id.ToString(), user.Id, "Invalid password", ipAddress, deviceInfo);
            await _profileService.AddSecurityLogAsync(user.Id, "Login Attempt", deviceInfo, ipAddress, "Invalid Password");
            return null; // Generic error "Invalid email or password"
        }

        // 5. Successful login - Reset failed access count
        await _userManager.ResetAccessFailedCountAsync(user);
        
        _logger.LogInformation("Successful login for email: {Email}", loginRequest.Email);
        await _auditService.LogAsync("LoginSuccess", "User", user.Id.ToString(), user.Id, null, ipAddress, deviceInfo);
        await _profileService.AddSecurityLogAsync(user.Id, "Login", deviceInfo, ipAddress, "Success");
        return await GenerateTokenResultAsync(user, ipAddress, deviceInfo);
    }

    public async Task<TokenResultDto?> RefreshTokenAsync(string refreshToken, string ipAddress)
    {
        var hashedToken = HashToken(refreshToken);
        var storedToken = (await _unitOfWork.Repository<RefreshToken>().FindAsync(t => t.TokenHash == hashedToken))
            .FirstOrDefault();

        if (storedToken == null)
        {
            _logger.LogWarning("Refresh token not found from IP: {IP}", ipAddress);
            return null;
        }

        // Token Reuse Detection
        if (storedToken.IsUsed)
        {
            _logger.LogCritical("SECURITY ALERT: Refresh token reuse detected for User ID: {UserId} from IP: {IP}. Revoking all sessions.", 
                storedToken.UserId, ipAddress);
            
            await _auditService.LogAsync("TokenReuseDetected", "RefreshToken", storedToken.Id.ToString(), storedToken.UserId, "Critical: Attempted reuse of refresh token", ipAddress);
            
            // Breach occurred: Invalidate all refresh tokens for this user
            await RevokeAllRefreshTokensAsync(storedToken.UserId, ipAddress);
            
            return null;
        }

        if (!storedToken.IsActive)
        {
            _logger.LogWarning("Invalid or expired refresh token attempt from IP: {IP}", ipAddress);
            return null;
        }

        // We need the user object, so we'll fetch it via UserManager
        var user = await _userManager.FindByIdAsync(storedToken.UserId.ToString());
        if (user == null) return null;

        // Token rotation: Mark old token as used and generate new ones
        storedToken.IsUsed = true;
        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.RevokedByIp = ipAddress;
        
        var newTokenResult = await GenerateTokenResultAsync(user, ipAddress, storedToken.DeviceInfo);
        
        storedToken.ReplacedByToken = newTokenResult.RefreshToken;
        await _unitOfWork.CompleteAsync();

        return newTokenResult;
    }

    public async Task<bool> RevokeTokenAsync(string refreshToken, string ipAddress)
    {
        var hashedToken = HashToken(refreshToken);
        var storedToken = (await _unitOfWork.Repository<RefreshToken>().FindAsync(t => t.TokenHash == hashedToken))
            .FirstOrDefault();

        if (storedToken == null) return false;

        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.RevokedByIp = ipAddress;
        
        await _unitOfWork.CompleteAsync();
        return true;
    }

    public async Task LogoutAsync(string refreshToken, string ipAddress)
    {
        await RevokeTokenAsync(refreshToken, ipAddress);
        _logger.LogInformation("User logged out and token revoked from IP: {IP}", ipAddress);
    }

    private async Task<TokenResultDto> GenerateTokenResultAsync(User user, string ipAddress, string? deviceInfo)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        foreach (var roleName in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, roleName));
            
            // Add permission claims from the role
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role != null)
            {
                var roleClaims = await _roleManager.GetClaimsAsync(role);
                foreach (var claim in roleClaims.Where(c => c.Type == "Permission"))
                {
                    if (!claims.Any(c => c.Type == "Permission" && c.Value == claim.Value))
                    {
                        claims.Add(claim);
                    }
                }
            }
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(15); // Access token: 15 mins

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = HashToken(refreshToken),
            ExpiryDate = DateTime.UtcNow.AddDays(7), // Refresh token: 7 days
            CreatedByIp = ipAddress,
            DeviceInfo = deviceInfo
        };

        await _unitOfWork.Repository<RefreshToken>().AddAsync(refreshTokenEntity);
        await _unitOfWork.CompleteAsync();

        return new TokenResultDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            AccessTokenExpiration = expires,
            FullName = user.FullName,
            Email = user.Email!,
            Role = roles.FirstOrDefault() ?? "User",
            Permissions = claims.Where(c => c.Type == "Permission").Select(c => c.Value).ToList()
        };
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private string HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
        return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequestDto forgotPasswordRequest, string ipAddress)
    {
        var user = await _userManager.FindByEmailAsync(forgotPasswordRequest.Email);
        if (user == null)
        {
            _logger.LogWarning("Forgot password requested for non-existent email: {Email} from IP: {IP}", forgotPasswordRequest.Email, ipAddress);
            return;
        }

        _logger.LogInformation("Forgot password OTP generated for: {Email} from IP: {IP}", user.Email, ipAddress);
        await _auditService.LogAsync("PasswordResetRequested", "User", user.Id.ToString(), user.Id, null, ipAddress);

        // Invalidate any existing OTPs and reset attempt counter for security
        await _userManager.UpdateSecurityStampAsync(user);
        var cacheKey = $"otp_attempts_{user.Email}";
        await _cache.RemoveAsync(cacheKey);

        // Generate a 6-digit OTP using the dedicated short-lived provider
        var otp = await _userManager.GenerateTwoFactorTokenAsync(user, "ShortLived");
        
        // Encode the OTP and email for the auto-fill magic link
        var encodedOtp = System.Web.HttpUtility.UrlEncode(otp);
        var encodedEmail = System.Web.HttpUtility.UrlEncode(user.Email);
        
        // Construct the magic reset link (frontend URL) that auto-fills the OTP
        var resetLink = $"{_appSettings.FrontendBaseUrl}/reset-password?otp={encodedOtp}&email={encodedEmail}";

        // Log the OTP to the console for debugging/development purposes
        // This ensures you can still test the flow even if your SMTP settings are not yet configured
        Console.WriteLine($"[DEBUG] Password reset code for {user.Email}: {otp}");

        var subject = "Your Password Reset Code - EG Law Office";
        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                <h2 style='color: #0f172a; text-align: center;'>Password Reset Request</h2>
                <p style='color: #475569; line-height: 1.6;'>Hello {user.FullName},</p>
                <p style='color: #475569; line-height: 1.6;'>We received a request to reset your password for your EG Law Office account. Please enter the following 6-digit verification code on the reset page:</p>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <span style='background-color: #f1f5f9; color: #0f172a; padding: 16px 32px; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 6px;'>{otp}</span>
                </div>

                <p style='color: #475569; line-height: 1.6; text-align: center;'>Or, you can simply click the button below to automatically apply this code:</p>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='{resetLink}' style='background-color: #0f172a; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Reset Password</a>
                </div>
                
                <p style='color: #64748b; font-size: 14px;'>If you didn't request this, you can safely ignore this email. This code will expire shortly.</p>
                <hr style='border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;'>
                <p style='color: #94a3b8; font-size: 12px; text-align: center;'>&copy; {DateTime.Now.Year} EG Law Office. All rights reserved.</p>
            </div>";

        await _emailService.SendEmailAsync(user.Email!, subject, body);
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequestDto resetPasswordRequest, string ipAddress)
    {
        var user = await _userManager.FindByEmailAsync(resetPasswordRequest.Email);
        if (user == null) return false;

        var cacheKey = $"otp_attempts_{user.Email}";
        var cachedAttempts = await _cache.GetStringAsync(cacheKey);
        int attempts = string.IsNullOrEmpty(cachedAttempts) ? 0 : int.Parse(cachedAttempts);

        if (attempts >= 10)
        {
            _logger.LogWarning("Max OTP attempts reached for user: {Email}. Revoking all tokens.", user.Email);
            // Max attempts reached, invalidate everything for security
            await _userManager.UpdateSecurityStampAsync(user);
            await RevokeAllRefreshTokensAsync(user.Id, ipAddress);
            await _cache.RemoveAsync(cacheKey);
            return false;
        }

        // Verify the 6-digit OTP using the dedicated short-lived provider
        var isOtpValid = await _userManager.VerifyTwoFactorTokenAsync(user, "ShortLived", resetPasswordRequest.Otp);
        
        if (!isOtpValid)
        {
            attempts++;
            _logger.LogWarning("Invalid OTP attempt ({Attempts}/3) for user: {Email}", attempts, user.Email);
            
            // Artificial delay to prevent brute-force
            await Task.Delay(1000);
            
            await _cache.SetStringAsync(cacheKey, attempts.ToString(), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
            });
            return false;
        }

        // OTP is valid, clear attempt counter
        await _cache.RemoveAsync(cacheKey);
        
        // OTP is valid, now generate the actual identity reset token internally
        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);

        // Reset the password
        var result = await _userManager.ResetPasswordAsync(user, resetToken, resetPasswordRequest.NewPassword);
        
        if (result.Succeeded)
        {
            _logger.LogInformation("Password successfully reset for user: {Email}", user.Email);
            await _auditService.LogAsync("PasswordResetSuccess", "User", user.Id.ToString(), user.Id, null, ipAddress);
            
            // Security Hardening: Revoke all refresh tokens on password change
            await _userManager.UpdateSecurityStampAsync(user);
            await RevokeAllRefreshTokensAsync(user.Id, ipAddress);
        }

        return result.Succeeded;
    }

    private async Task RevokeAllRefreshTokensAsync(Guid userId, string ipAddress)
    {
        var activeTokens = await _unitOfWork.Repository<RefreshToken>()
            .FindAsync(t => t.UserId == userId && t.IsUsed == false && t.IsRevoked == false);

        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            token.RevokedByIp = ipAddress;
        }

        await _unitOfWork.CompleteAsync();
    }

    public async Task<UserInfoDto?> GetUserInfoAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return null;

        var roles = await _userManager.GetRolesAsync(user);
        var permissions = new List<string>();

        foreach (var roleName in roles)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role != null)
            {
                var roleClaims = await _roleManager.GetClaimsAsync(role);
                permissions.AddRange(roleClaims
                    .Where(c => c.Type == "Permission")
                    .Select(c => c.Value)
                    .Where(p => !permissions.Contains(p)));
            }
        }

        return new UserInfoDto
        {
            FullName = user.FullName,
            Email = user.Email!,
            Role = roles.FirstOrDefault() ?? "User",
            Permissions = permissions
        };
    }
}
