using System;
using System.Collections.Generic;

namespace LawOffice.Application.DTOs.Dashboard;

public class DashboardStatsDto
{
    // User Role & Access Metadata
    public List<string> UserRoles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
    public bool CanViewFinancials { get; set; }
    public bool CanViewAllCases { get; set; }
    public bool CanManageUsers { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsLawyer { get; set; }

    // Overall Firm Portfolio Totals
    public int TotalClients { get; set; }
    public int NewClientsThisMonth { get; set; }

    public int TotalCases { get; set; }
    public int ActiveCasesCount { get; set; }
    public int PendingCasesCount { get; set; }
    public int SuspendedCasesCount { get; set; }
    public int FinishedCasesCount { get; set; }
    public int OpenCasesCount { get; set; } // Backward compatibility for InProgress

    public int TotalContracts { get; set; }
    public int ActiveContractsCount { get; set; }
    public int DraftingContractsCount { get; set; }

    public int TotalCompanies { get; set; }
    public int ActiveCompaniesCount { get; set; }

    public int TotalRegistrations { get; set; }
    public int ActiveRegistrationsCount { get; set; }

    public int TotalSessions { get; set; }
    public int UpcomingSessionsCount { get; set; }
    public int TodaySessionsCount { get; set; }
    public int TotalDocuments { get; set; }

    // Financial Overview (Calculated if CanViewFinancials)
    public decimal TotalInvoiced { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal PendingBalance { get; set; }
    public decimal TotalCancelled { get; set; }
    public int OverdueInvoicesCount { get; set; }
    public decimal CollectionRatePercentage { get; set; }

    // Charts & Distribution
    public List<ChartDataPoint> CasesByStatus { get; set; } = new();
    public List<ChartDataPoint> PortfolioDistribution { get; set; } = new();
    public List<MonthlyFinancialPoint> Last6MonthsFinance { get; set; } = new();

    // Lawyer Workload (for Admin / Users.View)
    public List<LawyerWorkloadDto> LawyerWorkloads { get; set; } = new();

    // Firm-Wide Upcoming Sessions & Urgent Cases (Next 7 days)
    public List<DashboardSessionDto> UpcomingSessions { get; set; } = new();
    public List<DashboardActionCaseDto> UrgentActionCases { get; set; } = new();

    // Personal Workspace (for all users, especially Lawyers/Partners)
    public PersonalWorkspaceDto MyWork { get; set; } = new();
}

public class ChartDataPoint
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
}

public class MonthlyFinancialPoint
{
    public string Month { get; set; } = string.Empty;
    public decimal Invoiced { get; set; }
    public decimal Paid { get; set; }
}

public class LawyerWorkloadDto
{
    public Guid LawyerId { get; set; }
    public string LawyerName { get; set; } = string.Empty;
    public int ActiveCasesCount { get; set; }
    public int ActiveContractsCount { get; set; }
    public int ActiveCompaniesCount { get; set; }
    public int ActiveRegistrationsCount { get; set; }
    public int TotalActiveWorks => ActiveCasesCount + ActiveContractsCount + ActiveCompaniesCount + ActiveRegistrationsCount;
    public int UpcomingSessionsCount { get; set; }
}

public class DashboardSessionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CaseNumber { get; set; } = string.Empty;
    public string CourtName { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? LawyerName { get; set; }
    public string? ClientName { get; set; }
    public Guid? CaseId { get; set; }
    public Guid? AssignedLawyerId { get; set; }
    public string? Location { get; set; }
    public string? CircuitNumber { get; set; }
    public string? CurrentSessionRole { get; set; }
    public string? Notes { get; set; }
    public string? Status { get; set; }
}

public class DashboardActionCaseDto
{
    public Guid Id { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string? ClientPhone { get; set; }
    public string? LawyerName { get; set; }
    public string ActionType { get; set; } = string.Empty; // Office, Court, External, Other
    public string ActionDescription { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public string? CourtCaseNumber { get; set; }
    public string? FileNumber { get; set; }
    public string? Status { get; set; }
    public string? SuspensionReason { get; set; }
}

public class PersonalWorkspaceDto
{
    public int MyActiveCasesCount { get; set; }
    public int MyUpcomingSessionsCount { get; set; }
    public int MyTodaySessionsCount { get; set; }
    public int MyActiveContractsCount { get; set; }
    public int MyActiveCompaniesCount { get; set; }
    public int MyActiveRegistrationsCount { get; set; }
    public List<DashboardSessionDto> MyUpcomingSessions { get; set; } = new();
    public List<DashboardActionCaseDto> MyActionCases { get; set; } = new();
}
