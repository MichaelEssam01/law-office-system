using System.Security.Claims;
using LawOffice.Application.DTOs.Cases;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Application.Common.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CasesController : ControllerBase
{
    private readonly ICaseService _caseService;

    public CasesController(ICaseService caseService)
    {
        _caseService = caseService;
    }

    [Authorize(Policy = Permissions.Cases.View)]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CaseListDto>>> GetAll(
        [FromQuery] string? status = null, 
        [FromQuery] Guid? clientId = null, 
        [FromQuery] Guid? lawyerId = null)
    {
        var cases = await _caseService.GetAllAsync(status, clientId, lawyerId);
        return Ok(cases);
    }

    [Authorize(Policy = Permissions.Cases.View)]
    [HttpGet("{id}")]
    public async Task<ActionResult<CaseDetailDto>> GetById(Guid id)
    {
        var @case = await _caseService.GetByIdAsync(id);
        if (@case == null) return NotFound();
        return Ok(@case);
    }

    [Authorize(Policy = Permissions.Cases.Create)]
    [HttpPost]
    public async Task<ActionResult<CaseDetailDto>> Create([FromBody] CreateCaseDto dto)
    {
        var userId = GetUserId();
        var createdCase = await _caseService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = createdCase.Id }, createdCase);
    }

    [Authorize(Policy = Permissions.Cases.Update)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCaseDto dto)
    {
        if (id != dto.Id) return BadRequest("ID mismatch");

        var userId = GetUserId();
        var result = await _caseService.UpdateAsync(dto, userId);
        
        if (!result) return NotFound();
        return NoContent();
    }

    [Authorize(Policy = Permissions.Cases.Delete)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _caseService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    private Guid GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdString, out var userId) ? userId : Guid.Empty;
    }
}
