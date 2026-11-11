using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LawOffice.Application.Common.Security;
using LawOffice.Application.DTOs.Dashboard;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using LawOffice.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<User> _userManager;

    public DashboardService(IUnitOfWork unitOfWork, UserManager<User> userManager)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(Guid userId, List<string> roles, List<string> permissions)
    {
        var stats = new DashboardStatsDto
        {
            UserRoles = roles ?? new List<string>(),
            Permissions = permissions ?? new List<string>()
        };

        var safeRoles = roles ?? new List<string>();
        var safePermissions = permissions ?? new List<string>();

        // 1. Determine User Capabilities & Access
        bool isAdmin = safeRoles.Any(r => r.Equals("Admin", StringComparison.OrdinalIgnoreCase)) 
                       || safePermissions.Contains(Permissions.Cases.ViewAll);
        bool canViewFinancials = isAdmin 
                                || safeRoles.Any(r => r.Equals("Accountant", StringComparison.OrdinalIgnoreCase)) 
                                || safePermissions.Contains(Permissions.Finance.View);
        bool canViewAllCases = isAdmin || safePermissions.Contains(Permissions.Cases.ViewAll);
        bool canManageUsers = isAdmin || safePermissions.Contains(Permissions.Users.View);
        bool isLawyer = safeRoles.Any(r => r.Equals("Lawyer", StringComparison.OrdinalIgnoreCase));

        stats.IsAdmin = isAdmin;
        stats.CanViewFinancials = canViewFinancials;
        stats.CanViewAllCases = canViewAllCases;
        stats.CanManageUsers = canManageUsers;
        stats.IsLawyer = isLawyer;

        var now = DateTime.UtcNow;
        var startOfToday = now.Date;
        var endOfToday = startOfToday.AddDays(1).AddTicks(-1);
        var sevenDaysLater = now.AddDays(7);
        var startOfMonth = new DateTime(now.Year, now.Month, 1);

        // 2. Firm-Wide Legal Portfolio Totals
        stats.TotalClients = await _unitOfWork.Repository<Client>().Query().CountAsync();
        stats.NewClientsThisMonth = await _unitOfWork.Repository<Client>().Query()
            .CountAsync(c => c.CreatedAt >= startOfMonth);

        // Cases
        var caseQuery = _unitOfWork.Repository<Case>().Query().AsNoTracking();
        stats.TotalCases = await caseQuery.CountAsync();
        stats.ActiveCasesCount = await caseQuery.CountAsync(c => c.Status == CaseStatus.InProgress);
        stats.PendingCasesCount = await caseQuery.CountAsync(c => c.Status == CaseStatus.Pending);
        stats.SuspendedCasesCount = await caseQuery.CountAsync(c => c.Status == CaseStatus.Suspended);
        stats.FinishedCasesCount = await caseQuery.CountAsync(c => c.Status == CaseStatus.Finished);
        stats.OpenCasesCount = stats.ActiveCasesCount; // backward-compat

        // Contracts
        var contractQuery = _unitOfWork.Repository<Contract>().Query().AsNoTracking();
        stats.TotalContracts = await contractQuery.CountAsync();
        stats.ActiveContractsCount = await contractQuery.CountAsync(c => c.Status != ContractStatus.InDrafting && (c.ClosedDate == null || c.ClosedDate >= now));
        stats.DraftingContractsCount = await contractQuery.CountAsync(c => c.Status == ContractStatus.InDrafting);

        // Companies
        var companyQuery = _unitOfWork.Repository<Company>().Query().AsNoTracking();
        stats.TotalCompanies = await companyQuery.CountAsync();
        stats.ActiveCompaniesCount = await companyQuery.CountAsync(c => c.Status == CompanyStatus.Active);

        // Registrations
        var registrationQuery = _unitOfWork.Repository<Registration>().Query().AsNoTracking();
        stats.TotalRegistrations = await registrationQuery.CountAsync();
        stats.ActiveRegistrationsCount = await registrationQuery.CountAsync(r => r.ResultDate == null);

        // Sessions
        var sessionQuery = _unitOfWork.Repository<Session>().Query().AsNoTracking();
        stats.TotalSessions = await sessionQuery.CountAsync();
        stats.UpcomingSessionsCount = await sessionQuery.CountAsync(s => s.ScheduledAt >= now && s.Status == SessionStatus.Scheduled);
        stats.TodaySessionsCount = await sessionQuery.CountAsync(s => s.ScheduledAt >= startOfToday && s.ScheduledAt <= endOfToday && s.Status != SessionStatus.Cancelled);

        // Documents
        stats.TotalDocuments = await _unitOfWork.Repository<Document>().Query().CountAsync();

        // Portfolio Distribution (Cases, Contracts, Companies, Registrations)
        stats.PortfolioDistribution = new List<ChartDataPoint>
        {
            new() { Label = "CASES", Value = stats.TotalCases },
            new() { Label = "CONTRACTS", Value = stats.TotalContracts },
            new() { Label = "COMPANIES", Value = stats.TotalCompanies },
            new() { Label = "REGISTRATIONS", Value = stats.TotalRegistrations }
        };

        // Cases by Status
        stats.CasesByStatus = await caseQuery
            .GroupBy(c => c.Status)
            .Select(g => new ChartDataPoint { Label = g.Key.ToString(), Value = g.Count() })
            .ToListAsync();

        // 3. Financial Overview (if user has financial access)
        if (canViewFinancials)
        {
            var invoices = await _unitOfWork.Repository<Invoice>().Query()
                .AsNoTracking()
                .Include(i => i.Payments)
                .ToListAsync();

            stats.TotalInvoiced = invoices.Sum(i => i.Amount);
            stats.TotalPaid = invoices.Sum(i => i.Payments.Sum(p => p.Amount));

            var activeInvoices = invoices.Where(i => i.Status != InvoiceStatus.Cancelled).ToList();
            var cancelledInvoices = invoices.Where(i => i.Status == InvoiceStatus.Cancelled).ToList();

            stats.PendingBalance = activeInvoices.Sum(i => i.Status == InvoiceStatus.Paid ? 0m : Math.Max(0m, i.Amount - i.Payments.Sum(p => p.Amount)));
            stats.TotalCancelled = cancelledInvoices.Sum(i => i.Amount);
            stats.OverdueInvoicesCount = activeInvoices.Count(i => i.Status == InvoiceStatus.Overdue || (i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled && i.DueDate < now));

            stats.CollectionRatePercentage = stats.TotalInvoiced > 0
                ? Math.Round((stats.TotalPaid / stats.TotalInvoiced) * 100m, 1)
                : 0m;

            // Monthly breakdown
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
                stats.Last6MonthsFinance.Add(new MonthlyFinancialPoint
                {
                    Month = now.ToString("MMM yyyy"),
                    Invoiced = 0,
                    Paid = 0
                });
            }
        }

        // 4. Lawyer Workload (for Admin / Users.View)
        if (canManageUsers)
        {
            var lawyers = await _userManager.Users
                .AsNoTracking()
                .Where(u => u.IsActive)
                .ToListAsync();

            foreach (var lawyer in lawyers)
            {
                int activeCases = await caseQuery.CountAsync(c => c.AssignedLawyerId == lawyer.Id && c.Status == CaseStatus.InProgress);
                int activeContracts = await contractQuery.CountAsync(c => c.AssignedLawyerId == lawyer.Id && c.Status != ContractStatus.InDrafting && (c.ClosedDate == null || c.ClosedDate >= now));
                int activeCompanies = await companyQuery.CountAsync(c => c.AssignedLawyerId == lawyer.Id && c.Status == CompanyStatus.Active);
                int activeRegs = await registrationQuery.CountAsync(r => r.AssignedLawyerId == lawyer.Id && r.ResultDate == null);
                int upcomingSess = await sessionQuery.CountAsync(s => s.AssignedLawyerId == lawyer.Id && s.ScheduledAt >= now && s.Status == SessionStatus.Scheduled);

                // Include if lawyer has any assigned work or upcoming sessions
                if (activeCases > 0 || activeContracts > 0 || activeCompanies > 0 || activeRegs > 0 || upcomingSess > 0)
                {
                    stats.LawyerWorkloads.Add(new LawyerWorkloadDto
                    {
                        LawyerId = lawyer.Id,
                        LawyerName = lawyer.FullName,
                        ActiveCasesCount = activeCases,
                        ActiveContractsCount = activeContracts,
                        ActiveCompaniesCount = activeCompanies,
                        ActiveRegistrationsCount = activeRegs,
                        UpcomingSessionsCount = upcomingSess
                    });
                }
            }
        }

        // 5. Firm-Wide Upcoming Sessions (Next 7 days, top 10)
        stats.UpcomingSessions = await sessionQuery
            .Where(s => s.ScheduledAt >= now && s.ScheduledAt <= sevenDaysLater && s.Status == SessionStatus.Scheduled)
            .OrderBy(s => s.ScheduledAt)
            .Take(10)
            .Include(s => s.Case)
                .ThenInclude(c => c!.Client)
            .Include(s => s.AssignedLawyer)
            .Select(s => new DashboardSessionDto
            {
                Id = s.Id,
                Title = s.Title,
                CaseId = s.CaseId,
                CaseNumber = s.Case != null ? s.Case.CaseNumber : string.Empty,
                CourtName = s.CourtName,
                ScheduledAt = s.ScheduledAt,
                LawyerName = s.AssignedLawyer != null ? s.AssignedLawyer.FullName : null,
                AssignedLawyerId = s.AssignedLawyerId,
                Location = s.Location,
                CircuitNumber = s.CircuitNumber,
                CurrentSessionRole = s.CurrentSessionRole,
                Notes = s.Notes,
                Status = s.Status.ToString(),
                ClientName = s.Case != null && s.Case.Client != null ? s.Case.Client.FullName : null
            })
            .ToListAsync();

        // 6. Firm-Wide Urgent Action Cases (Cases with actions required, top 10)
        stats.UrgentActionCases = await caseQuery
            .Where(c => (c.Status == CaseStatus.InProgress || c.Status == CaseStatus.Pending || c.Status == CaseStatus.Suspended)
                        && (c.HasOfficeAction == true || c.HasCourtAction == true || c.HasExternalAction == true || c.HasOtherAction == true))
            .OrderByDescending(c => c.StartDate)
            .Take(10)
            .Include(c => c.Client)
            .Include(c => c.AssignedLawyer)
            .Select(c => new DashboardActionCaseDto
            {
                Id = c.Id,
                CaseNumber = c.CaseNumber,
                Title = c.Title,
                ClientName = c.Client != null ? c.Client.FullName : string.Empty,
                ClientPhone = c.Client != null ? c.Client.Phone : null,
                LawyerName = c.AssignedLawyer != null ? c.AssignedLawyer.FullName : null,
                ActionType = c.HasCourtAction == true ? "Court" :
                             c.HasOfficeAction == true ? "Office" :
                             c.HasExternalAction == true ? "External" : "Other",
                ActionDescription = c.HasCourtAction == true ? (c.CourtAction ?? "") :
                                    c.HasOfficeAction == true ? (c.OfficeAction ?? "") :
                                    c.HasExternalAction == true ? (c.ExternalAction ?? "") : (c.OtherAction ?? ""),
                StartDate = c.StartDate,
                CourtCaseNumber = c.CourtCaseNumber,
                FileNumber = c.FileNumber,
                Status = c.Status.ToString(),
                SuspensionReason = c.SuspensionReason
            })
            .ToListAsync();

        // 7. Personal Workspace (for all users who have personal assigned tasks)
        if (userId != Guid.Empty)
        {
            var my = new PersonalWorkspaceDto
            {
                MyActiveCasesCount = await caseQuery.CountAsync(c => c.AssignedLawyerId == userId && c.Status == CaseStatus.InProgress),
                MyUpcomingSessionsCount = await sessionQuery.CountAsync(s => s.AssignedLawyerId == userId && s.ScheduledAt >= now && s.Status == SessionStatus.Scheduled),
                MyTodaySessionsCount = await sessionQuery.CountAsync(s => s.AssignedLawyerId == userId && s.ScheduledAt >= startOfToday && s.ScheduledAt <= endOfToday && s.Status != SessionStatus.Cancelled),
                MyActiveContractsCount = await contractQuery.CountAsync(c => c.AssignedLawyerId == userId && c.Status != ContractStatus.InDrafting && (c.ClosedDate == null || c.ClosedDate >= now)),
                MyActiveCompaniesCount = await companyQuery.CountAsync(c => c.AssignedLawyerId == userId && c.Status == CompanyStatus.Active),
                MyActiveRegistrationsCount = await registrationQuery.CountAsync(r => r.AssignedLawyerId == userId && r.ResultDate == null)
            };

            my.MyUpcomingSessions = await sessionQuery
                .Where(s => s.AssignedLawyerId == userId && s.ScheduledAt >= now && s.ScheduledAt <= sevenDaysLater && s.Status == SessionStatus.Scheduled)
                .OrderBy(s => s.ScheduledAt)
                .Take(10)
                .Include(s => s.Case)
                    .ThenInclude(c => c!.Client)
                .Select(s => new DashboardSessionDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    CaseId = s.CaseId,
                    CaseNumber = s.Case != null ? s.Case.CaseNumber : string.Empty,
                    CourtName = s.CourtName,
                    ScheduledAt = s.ScheduledAt,
                    AssignedLawyerId = s.AssignedLawyerId,
                    Location = s.Location,
                    CircuitNumber = s.CircuitNumber,
                    CurrentSessionRole = s.CurrentSessionRole,
                    Notes = s.Notes,
                    Status = s.Status.ToString(),
                    ClientName = s.Case != null && s.Case.Client != null ? s.Case.Client.FullName : null
                })
                .ToListAsync();

            my.MyActionCases = await caseQuery
                .Where(c => c.AssignedLawyerId == userId && (c.Status == CaseStatus.InProgress || c.Status == CaseStatus.Pending || c.Status == CaseStatus.Suspended)
                            && (c.HasOfficeAction == true || c.HasCourtAction == true || c.HasExternalAction == true || c.HasOtherAction == true))
                .OrderByDescending(c => c.StartDate)
                .Take(10)
                .Include(c => c.Client)
                .Select(c => new DashboardActionCaseDto
                {
                    Id = c.Id,
                    CaseNumber = c.CaseNumber,
                    Title = c.Title,
                    ClientName = c.Client != null ? c.Client.FullName : string.Empty,
                    ClientPhone = c.Client != null ? c.Client.Phone : null,
                    ActionType = c.HasCourtAction == true ? "Court" :
                                 c.HasOfficeAction == true ? "Office" :
                                 c.HasExternalAction == true ? "External" : "Other",
                    ActionDescription = c.HasCourtAction == true ? (c.CourtAction ?? "") :
                                        c.HasOfficeAction == true ? (c.OfficeAction ?? "") :
                                        c.HasExternalAction == true ? (c.ExternalAction ?? "") : (c.OtherAction ?? ""),
                    StartDate = c.StartDate,
                    CourtCaseNumber = c.CourtCaseNumber,
                    FileNumber = c.FileNumber,
                    Status = c.Status.ToString(),
                    SuspensionReason = c.SuspensionReason
                })
                .ToListAsync();

            stats.MyWork = my;
        }

        return stats;
    }
}
