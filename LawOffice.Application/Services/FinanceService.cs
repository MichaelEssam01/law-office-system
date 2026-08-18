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
        var now = DateTime.UtcNow;
        var allInvoices = await _unitOfWork.Repository<Invoice>().Query()
            .AsNoTracking()
            .Include(i => i.Payments)
            .ToListAsync();

        var totalInvoiced = allInvoices.Sum(i => i.Amount);
        
        var totalPaid = await _unitOfWork.Repository<Payment>().Query()
            .AsNoTracking()
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        var activeInvoices = allInvoices.Where(i => i.Status != InvoiceStatus.Cancelled).ToList();
        var cancelledInvoices = allInvoices.Where(i => i.Status == InvoiceStatus.Cancelled).ToList();

        var totalRemaining = activeInvoices.Sum(i => i.Status == InvoiceStatus.Paid ? 0m : Math.Max(0m, i.Amount - i.Payments.Sum(p => p.Amount)));
        var totalCancelled = cancelledInvoices.Sum(i => Math.Max(0m, i.Amount - i.Payments.Sum(p => p.Amount)));

        var unpaidCount = activeInvoices.Count(i => i.Status == InvoiceStatus.Unpaid || i.Status == InvoiceStatus.PartiallyPaid);
        var overdueCount = activeInvoices.Count(i => i.Status == InvoiceStatus.Overdue || 
                                                     (i.Status != InvoiceStatus.Paid && i.DueDate < now));

        return new FinancialSummaryDto
        {
            TotalInvoiced = totalInvoiced,
            TotalPaid = totalPaid,
            TotalRemaining = totalRemaining,
            TotalCancelled = totalCancelled,
            UnpaidInvoicesCount = unpaidCount,
            OverdueInvoicesCount = overdueCount
        };
    }

    public async Task<FinancialSummaryDto> GetCaseSummaryAsync(Guid caseId)
    {
        var now = DateTime.UtcNow;
        var caseInvoices = await _unitOfWork.Repository<Invoice>().Query()
            .AsNoTracking()
            .Include(i => i.Payments)
            .Where(i => i.CaseId == caseId)
            .ToListAsync();

        var totalInvoiced = caseInvoices.Sum(i => i.Amount);
            
        var totalPaid = await _unitOfWork.Repository<Payment>().Query()
            .Where(p => p.CaseId == caseId)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        var activeInvoices = caseInvoices.Where(i => i.Status != InvoiceStatus.Cancelled).ToList();
        var cancelledInvoices = caseInvoices.Where(i => i.Status == InvoiceStatus.Cancelled).ToList();

        var totalRemaining = activeInvoices.Sum(i => i.Status == InvoiceStatus.Paid ? 0m : Math.Max(0m, i.Amount - i.Payments.Sum(p => p.Amount)));
        var totalCancelled = cancelledInvoices.Sum(i => Math.Max(0m, i.Amount - i.Payments.Sum(p => p.Amount)));

        var unpaidCount = activeInvoices.Count(i => i.Status == InvoiceStatus.Unpaid || i.Status == InvoiceStatus.PartiallyPaid);
        var overdueCount = activeInvoices.Count(i => i.Status == InvoiceStatus.Overdue || 
                                                     (i.Status != InvoiceStatus.Paid && i.DueDate < now));

        return new FinancialSummaryDto
        {
            TotalInvoiced = totalInvoiced,
            TotalPaid = totalPaid,
            TotalRemaining = totalRemaining,
            TotalCancelled = totalCancelled,
            UnpaidInvoicesCount = unpaidCount,
            OverdueInvoicesCount = overdueCount
        };
    }
}
