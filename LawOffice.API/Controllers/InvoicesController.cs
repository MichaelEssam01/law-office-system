using LawOffice.Application.DTOs.Finance;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    public InvoicesController(IInvoiceService invoiceService) => _invoiceService = invoiceService;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvoiceListDto>>> GetInvoices([FromQuery] Guid? caseId, [FromQuery] InvoiceStatus? status)
        => Ok(await _invoiceService.GetInvoicesAsync(caseId, status));

    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceDetailDto>> GetInvoice(Guid id)
    {
        var i = await _invoiceService.GetInvoiceByIdAsync(id);
        return i != null ? Ok(i) : NotFound();
    }

    [HttpPost]
    public async Task<ActionResult<InvoiceDetailDto>> CreateInvoice(CreateInvoiceDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var i = await _invoiceService.CreateInvoiceAsync(dto, userId);
        return CreatedAtAction(nameof(GetInvoice), new { id = i.Id }, i);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateInvoice(Guid id, UpdateInvoiceDto dto)
    {
        await _invoiceService.UpdateInvoiceAsync(id, dto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInvoice(Guid id)
    {
        await _invoiceService.DeleteInvoiceAsync(id);
        return NoContent();
    }
}
