using LawOffice.Application.DTOs.Dashboard;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using LawOffice.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;

    public DashboardService(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<DashboardStatsDto> GetStatsAsync()
    {
        var stats = new DashboardStatsDto();

        // 1. Basic Counts
        stats.TotalClients = await _unitOfWork.Repository<Client>().Query().CountAsync();
        stats.TotalCases = await _unitOfWork.Repository<Case>().Query().CountAsync();
        stats.OpenCasesCount = await _unitOfWork.Repository<Case>().Query().CountAsync(c => c.Status == CaseStatus.Open);
        stats.UpcomingSessionsCount = await _unitOfWork.Repository<Session>().Query()
            .CountAsync(s => s.ScheduledAt >= DateTime.UtcNow && s.Status == SessionStatus.Scheduled);
        stats.TotalDocuments = await _unitOfWork.Repository<Document>().Query().CountAsync();

        // 2. Financial Totals
        var invoices = await _unitOfWork.Repository<Invoice>().Query()
            .Include(i => i.Payments)
            .ToListAsync();
        stats.TotalInvoiced = invoices.Sum(i => i.Amount);
        stats.TotalPaid = invoices.Sum(i => i.Payments.Sum(p => p.Amount));
        stats.PendingBalance = stats.TotalInvoiced - stats.TotalPaid;
        stats.OverdueInvoicesCount = invoices.Count(i => i.Status == InvoiceStatus.Overdue);

        // 3. Cases by Status Chart
        var statusGroups = await _unitOfWork.Repository<Case>().Query()
            .GroupBy(c => c.Status)
            .Select(g => new ChartDataPoint { Label = g.Key.ToString(), Value = g.Count() })
            .ToListAsync();
        stats.CasesByStatus = statusGroups;

        // 4. Last 6 Months Finance (Simplified for now)
        // In a real app we'd group by month. Here we just return current month as a sample.
        stats.Last6MonthsFinance.Add(new MonthlyFinancialPoint 
        { 
            Month = DateTime.UtcNow.ToString("MMM yyyy"),
            Invoiced = stats.TotalInvoiced,
            Paid = stats.TotalPaid
        });

        return stats;
    }
}
