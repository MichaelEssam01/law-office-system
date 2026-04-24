using LawOffice.Application.DTOs.Sessions;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SessionsController : ControllerBase
{
    private readonly ISessionService _sessionService;

    public SessionsController(ISessionService sessionService)
    {
        _sessionService = sessionService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SessionListDto>>> GetSessions([FromQuery] Guid? caseId, [FromQuery] SessionStatus? status, [FromQuery] DateTime? date)
    {
        var sessions = await _sessionService.GetSessionsAsync(caseId, status, date);
        return Ok(sessions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SessionDetailDto>> GetSession(Guid id)
    {
        var session = await _sessionService.GetSessionByIdAsync(id);
        if (session == null) return NotFound();
        return Ok(session);
    }

    [HttpPost]
    public async Task<ActionResult<SessionDetailDto>> CreateSession(SessionCreateDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var session = await _sessionService.CreateSessionAsync(dto, userId);
        return CreatedAtAction(nameof(GetSession), new { id = session.Id }, session);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSession(Guid id, SessionUpdateDto dto)
    {
        await _sessionService.UpdateSessionAsync(id, dto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSession(Guid id)
    {
        await _sessionService.DeleteSessionAsync(id);
        return NoContent();
    }
}
