using System.Security.Claims;
using LawOffice.Application.Common.Security;
using LawOffice.Application.DTOs.Contracts;
using LawOffice.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ContractsController : ControllerBase
{
    private readonly IContractService _contractService;

    public ContractsController(IContractService contractService)
    {
        _contractService = contractService;
    }

    [Authorize(Policy = Permissions.Contracts.View)]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ContractListDto>>> GetAll(
        [FromQuery] string? status = null,
        [FromQuery] Guid? clientId = null,
        [FromQuery] Guid? lawyerId = null)
    {
        var items = await _contractService.GetAllAsync(status, clientId, lawyerId);
        return Ok(items);
    }

    [Authorize(Policy = Permissions.Contracts.View)]
    [HttpGet("{id}")]
    public async Task<ActionResult<ContractDetailDto>> GetById(Guid id)
    {
        var item = await _contractService.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [Authorize(Policy = Permissions.Contracts.Create)]
    [HttpPost]
    public async Task<ActionResult<ContractDetailDto>> Create([FromBody] CreateContractDto dto)
    {
        var userId = GetUserId();
        var created = await _contractService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Policy = Permissions.Contracts.Update)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateContractDto dto)
    {
        if (id != dto.Id) return BadRequest("ID mismatch");
        var userId = GetUserId();
        var result = await _contractService.UpdateAsync(dto, userId);
        if (!result) return NotFound();
        return NoContent();
    }

    [Authorize(Policy = Permissions.Contracts.Delete)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _contractService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    private Guid GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdString, out var userId) ? userId : Guid.Empty;
    }
}

