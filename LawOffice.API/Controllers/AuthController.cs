using LawOffice.Application.DTOs.Auth;
using LawOffice.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace LawOffice.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto loginRequest)
    {
        var response = await _authService.LoginAsync(loginRequest);

        if (response == null)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        return Ok(response);
    }
}
