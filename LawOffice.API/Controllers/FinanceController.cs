using LawOffice.Application.DTOs.Finance;
using LawOffice.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FinanceController : ControllerBase
{
    private readonly IFinanceService _financeService;
    public FinanceController(IFinanceService financeService) => _financeService = financeService;

    [HttpGet("summary")]
    public async Task<ActionResult<FinancialSummaryDto>> GetGlobalSummary()
        => Ok(await _financeService.GetGlobalSummaryAsync());

    [HttpGet("summary/{caseId}")]
    public async Task<ActionResult<FinancialSummaryDto>> GetCaseSummary(Guid caseId)
        => Ok(await _financeService.GetCaseSummaryAsync(caseId));
}
