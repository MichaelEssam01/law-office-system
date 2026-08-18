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
            .AsNoTracking()
            .Include(i => i.Payments)
            .ToListAsync();
        stats.TotalInvoiced = invoices.Sum(i => i.Amount);
        stats.TotalPaid = invoices.Sum(i => i.Payments.Sum(p => p.Amount));
        
        var activeInvoices = invoices.Where(i => i.Status != InvoiceStatus.Cancelled).ToList();
        var cancelledInvoices = invoices.Where(i => i.Status == InvoiceStatus.Cancelled).ToList();

        stats.PendingBalance = activeInvoices.Sum(i => i.Status == InvoiceStatus.Paid ? 0m : Math.Max(0m, i.Amount - i.Payments.Sum(p => p.Amount)));
        stats.TotalCancelled = cancelledInvoices.Sum(i => Math.Max(0m, i.Amount - i.Payments.Sum(p => p.Amount)));
        stats.OverdueInvoicesCount = activeInvoices.Count(i => i.Status == InvoiceStatus.Overdue || (i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled && i.DueDate < DateTime.UtcNow));

        // 3. Cases by Status Chart
        var statusGroups = await _unitOfWork.Repository<Case>().Query()
            .AsNoTracking()
            .GroupBy(c => c.Status)
            .Select(g => new ChartDataPoint { Label = g.Key.ToString(), Value = g.Count() })
            .ToListAsync();
        stats.CasesByStatus = statusGroups;

        // 4. Monthly Financial Points (Dynamically calculated from all existing invoice dates)
        var monthlyGroups = invoices
            .GroupBy(inv => new { inv.CreatedAt.Year, inv.CreatedAt.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .ToList();

        if (monthlyGroups.Any())
        {
            foreach (var g in monthlyGroups)
            {
                var dt = new DateTime(g.Key.Year, g.Key.Month, 1);
                decimal monthInvoiced = g.Sum(inv => inv.Amount);
                decimal monthPaid = g.Sum(inv => inv.Payments.Sum(p => p.Amount));

                stats.Last6MonthsFinance.Add(new MonthlyFinancialPoint
                {
                    Month = dt.ToString("MMM yyyy"),
                    Invoiced = monthInvoiced,
                    Paid = monthPaid
                });
            }
        }
        else
        {
            // Fallback to current month if no invoices exist yet
            stats.Last6MonthsFinance.Add(new MonthlyFinancialPoint
            {
                Month = DateTime.UtcNow.ToString("MMM yyyy"),
                Invoiced = 0,
                Paid = 0
            });
        }

        return stats;
    }
}
