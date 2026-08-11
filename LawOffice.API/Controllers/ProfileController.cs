using LawOffice.Application.DTOs.Profile;
using LawOffice.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly IUserProfileService _profileService;

    public ProfileController(IUserProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet("security-logs")]
    public async Task<ActionResult<IEnumerable<SecurityLogDto>>> GetSecurityLogs()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _profileService.GetSecurityLogsAsync(userId));
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<NotificationSettingsDto>> GetNotificationSettings()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _profileService.GetNotificationSettingsAsync(userId));
    }

    [HttpPut("notifications")]
    public async Task<IActionResult> UpdateNotificationSettings(NotificationSettingsDto settings)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _profileService.UpdateNotificationSettingsAsync(userId, settings);
        return NoContent();
    }

    [HttpGet("security-logs/export")]
    public async Task<IActionResult> ExportSecurityLogs()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var excelBytes = await _profileService.ExportSecurityLogsCsvAsync(userId);
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"security_logs_{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }
}
