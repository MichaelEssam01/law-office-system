using System.Security.Claims;
using LawOffice.Application.Common.Security;
using LawOffice.Application.DTOs.Registrations;
using LawOffice.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RegistrationsController : ControllerBase
{
    private readonly IRegistrationService _registrationService;

    public RegistrationsController(IRegistrationService registrationService)
    {
        _registrationService = registrationService;
    }

    [Authorize(Policy = Permissions.Cases.View)]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RegistrationListDto>>> GetAll(
        [FromQuery] Guid? clientId = null,
        [FromQuery] Guid? lawyerId = null)
    {
        var items = await _registrationService.GetAllAsync(clientId, lawyerId);
        return Ok(items);
    }

    [Authorize(Policy = Permissions.Cases.View)]
    [HttpGet("{id}")]
    public async Task<ActionResult<RegistrationDetailDto>> GetById(Guid id)
    {
        var item = await _registrationService.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [Authorize(Policy = Permissions.Cases.Create)]
    [HttpPost]
    public async Task<ActionResult<RegistrationDetailDto>> Create([FromBody] CreateRegistrationDto dto)
    {
        var userId = GetUserId();
        var created = await _registrationService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Policy = Permissions.Cases.Update)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRegistrationDto dto)
    {
        if (id != dto.Id) return BadRequest("ID mismatch");
        var userId = GetUserId();
        var result = await _registrationService.UpdateAsync(dto, userId);
        if (!result) return NotFound();
        return NoContent();
    }

    [Authorize(Policy = Permissions.Cases.Delete)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _registrationService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    private Guid GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdString, out var userId) ? userId : Guid.Empty;
    }
}

