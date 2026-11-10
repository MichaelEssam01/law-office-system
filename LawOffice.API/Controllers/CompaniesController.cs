using System.Security.Claims;
using LawOffice.Application.Common.Security;
using LawOffice.Application.DTOs.Companies;
using LawOffice.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyService _companyService;

    public CompaniesController(ICompanyService companyService)
    {
        _companyService = companyService;
    }

    [Authorize(Policy = Permissions.Companies.View)]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CompanyListDto>>> GetAll(
        [FromQuery] string? status = null,
        [FromQuery] Guid? clientId = null,
        [FromQuery] Guid? lawyerId = null)
    {
        var items = await _companyService.GetAllAsync(status, clientId, lawyerId);
        return Ok(items);
    }

    [Authorize(Policy = Permissions.Companies.View)]
    [HttpGet("{id}")]
    public async Task<ActionResult<CompanyDetailDto>> GetById(Guid id)
    {
        var item = await _companyService.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [Authorize(Policy = Permissions.Companies.Create)]
    [HttpPost]
    public async Task<ActionResult<CompanyDetailDto>> Create([FromBody] CreateCompanyDto dto)
    {
        var userId = GetUserId();
        var created = await _companyService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Policy = Permissions.Companies.Update)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCompanyDto dto)
    {
        if (id != dto.Id) return BadRequest("ID mismatch");
        var userId = GetUserId();
        var result = await _companyService.UpdateAsync(dto, userId);
        if (!result) return NotFound();
        return NoContent();
    }

    [Authorize(Policy = Permissions.Companies.Delete)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _companyService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    private Guid GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdString, out var userId) ? userId : Guid.Empty;
    }
}

