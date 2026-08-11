using LawOffice.Application.DTOs.Auth;
using LawOffice.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

using LawOffice.Application.Common.Exceptions;
using System.Security.Claims;

namespace LawOffice.API.Controllers;

[ApiController]
[Route("api/[controller]")]

public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _env;

    public AuthController(IAuthService authService, IWebHostEnvironment env)
    {
        _authService = authService;
        _env = env;
    }

    [DisableRateLimiting]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

        var userInfo = await _authService.GetUserInfoAsync(userId);
        if (userInfo == null) return Unauthorized();

        return Ok(userInfo);
    }

    [AllowAnonymous]
    [EnableRateLimiting("AuthPolicy")]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto loginRequest)
    {
        try
        {
            var result = await _authService.LoginAsync(loginRequest, GetIpAddress(), Request.Headers["User-Agent"]!);

            if (result == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            SetTokenCookies(result);

            return Ok(new
            {
                fullName = result.FullName,
                email = result.Email,
                role = result.Role,
                permissions = result.Permissions,
                expiration = result.AccessTokenExpiration
            });
        }
        catch (AccountLockedException)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { 
                message = "Account is locked due to multiple failed attempts. Please try again later or contact support." 
            });
        }
    }

    [AllowAnonymous]
    [DisableRateLimiting]
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken)) return Unauthorized();

        var result = await _authService.RefreshTokenAsync(refreshToken, GetIpAddress());
        if (result == null) return Unauthorized();

        SetTokenCookies(result);
        return Ok(new
        {
            fullName = result.FullName,
            email = result.Email,
            role = result.Role,
            permissions = result.Permissions,
            expiration = result.AccessTokenExpiration
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _authService.LogoutAsync(refreshToken, GetIpAddress());
        }

        var cookieOptions = GetCookieOptions();
        Response.Cookies.Delete("accessToken", cookieOptions);
        Response.Cookies.Delete("refreshToken", cookieOptions);

        return Ok(new { message = "Logged out successfully" });
    }

    [AllowAnonymous]
    [EnableRateLimiting("AuthPolicy")]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto forgotPasswordRequest)
    {
        await _authService.ForgotPasswordAsync(forgotPasswordRequest, GetIpAddress());
        return Ok(new { message = "If your email is registered, you will receive a verification code." });
    }

    [AllowAnonymous]
    [EnableRateLimiting("AuthPolicy")]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto resetPasswordRequest)
    {
        var result = await _authService.ResetPasswordAsync(resetPasswordRequest, GetIpAddress());

        if (!result)
        {
            return BadRequest(new { message = "Invalid code or max attempts reached. Please request a new code." });
        }

        // On success, clear any old auth cookies
        var cookieOptions = GetCookieOptions();
        Response.Cookies.Delete("accessToken", cookieOptions);
        Response.Cookies.Delete("refreshToken", cookieOptions);

        return Ok(new { message = "Password reset successfully" });
    }

    private void SetTokenCookies(TokenResultDto tokens)
    {
        var accessOptions = GetCookieOptions(tokens.AccessTokenExpiration);
        Response.Cookies.Append("accessToken", tokens.AccessToken, accessOptions);

        var refreshOptions = GetCookieOptions(DateTime.UtcNow.AddDays(7));
        Response.Cookies.Append("refreshToken", tokens.RefreshToken, refreshOptions);
    }

    private CookieOptions GetCookieOptions(DateTime? expires = null)
    {
        var isDev = _env.IsDevelopment();
        
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDev,
            SameSite = isDev ? SameSiteMode.Lax : SameSiteMode.None,
            Path = "/",
            Expires = expires
        };
    }

    private string GetIpAddress()
    {
        if (Request.Headers.ContainsKey("X-Forwarded-For"))
            return Request.Headers["X-Forwarded-For"]!;
        else
            return HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "unknown";
    }
}
