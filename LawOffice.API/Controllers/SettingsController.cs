using LawOffice.Application.DTOs.Settings;
using LawOffice.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;

    public SettingsController(ISettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<SystemSettingDto>> GetSettings()
    {
        return Ok(await _settingsService.GetSettingsAsync());
    }

    [AllowAnonymous]
    [HttpGet("public")]
    public async Task<ActionResult<PublicSettingDto>> GetPublicSettings()
    {
        return Ok(await _settingsService.GetPublicSettingsAsync());
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<IActionResult> UpdateSettings(SystemSettingDto dto)
    {
        await _settingsService.UpdateSettingsAsync(dto);
        return NoContent();
    }
}
