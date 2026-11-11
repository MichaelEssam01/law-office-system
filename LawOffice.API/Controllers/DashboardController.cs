using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using LawOffice.Application.DTOs.Dashboard;
using LawOffice.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid.TryParse(userIdString, out var userId);

        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).Distinct().ToList();
        var permissions = User.FindAll("Permission").Select(c => c.Value).Distinct().ToList();

        return Ok(await _dashboardService.GetStatsAsync(userId, roles, permissions));
    }
}
