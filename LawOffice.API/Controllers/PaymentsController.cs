using LawOffice.Application.DTOs.Finance;
using LawOffice.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    public PaymentsController(IPaymentService paymentService) => _paymentService = paymentService;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PaymentListDto>>> GetPayments([FromQuery] Guid? caseId, [FromQuery] Guid? invoiceId)
        => Ok(await _paymentService.GetPaymentsAsync(caseId, invoiceId));

    [HttpGet("{id}")]
    public async Task<ActionResult<PaymentListDto>> GetPayment(Guid id)
    {
        var p = await _paymentService.GetPaymentByIdAsync(id);
        return p != null ? Ok(p) : NotFound();
    }

    [HttpPost]
    public async Task<ActionResult<PaymentListDto>> CreatePayment(CreatePaymentDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var p = await _paymentService.CreatePaymentAsync(dto, userId);
        return CreatedAtAction(nameof(GetPayment), new { id = p.Id }, p);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePayment(Guid id, UpdatePaymentDto dto)
    {
        await _paymentService.UpdatePaymentAsync(id, dto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePayment(Guid id)
    {
        await _paymentService.DeletePaymentAsync(id);
        return NoContent();
    }
}
