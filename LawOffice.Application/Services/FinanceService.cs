using LawOffice.Application.DTOs.Finance;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using LawOffice.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Application.Services;

public class FinanceService : IFinanceService
{
    private readonly IUnitOfWork _unitOfWork;

    public FinanceService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<FinancialSummaryDto> GetGlobalSummaryAsync()
    {
        var totalInvoiced = await _unitOfWork.Repository<Invoice>().Query().SumAsync(i => i.Amount);
        var totalPaid = await _unitOfWork.Repository<Payment>().Query().SumAsync(p => p.Amount);
        var unpaidCount = await _unitOfWork.Repository<Invoice>().Query().CountAsync(i => i.Status == InvoiceStatus.Unpaid || i.Status == InvoiceStatus.PartiallyPaid);
        var overdueCount = await _unitOfWork.Repository<Invoice>().Query().CountAsync(i => i.Status == InvoiceStatus.Overdue);

        return new FinancialSummaryDto
        {
            TotalInvoiced = totalInvoiced,
            TotalPaid = totalPaid,
            TotalRemaining = totalInvoiced - totalPaid,
            UnpaidInvoicesCount = unpaidCount,
            OverdueInvoicesCount = overdueCount
        };
    }

    public async Task<FinancialSummaryDto> GetCaseSummaryAsync(Guid caseId)
    {
        var totalInvoiced = await _unitOfWork.Repository<Invoice>().Query()
            .Where(i => i.CaseId == caseId && i.Status != InvoiceStatus.Cancelled)
            .SumAsync(i => i.Amount);
            
        var totalPaid = await _unitOfWork.Repository<Payment>().Query()
            .Where(p => p.CaseId == caseId)
            .SumAsync(p => p.Amount);

        var unpaidCount = await _unitOfWork.Repository<Invoice>().Query()
            .Where(i => i.CaseId == caseId && (i.Status == InvoiceStatus.Unpaid || i.Status == InvoiceStatus.PartiallyPaid))
            .CountAsync();

        var overdueCount = await _unitOfWork.Repository<Invoice>().Query()
            .Where(i => i.CaseId == caseId && i.Status == InvoiceStatus.Overdue)
            .CountAsync();

        return new FinancialSummaryDto
        {
            TotalInvoiced = totalInvoiced,
            TotalPaid = totalPaid,
            TotalRemaining = totalInvoiced - totalPaid,
            UnpaidInvoicesCount = unpaidCount,
            OverdueInvoicesCount = overdueCount
        };
    }
}
