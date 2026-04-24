namespace LawOffice.Application.DTOs.Dashboard;

public class DashboardStatsDto
{
    public int TotalClients { get; set; }
    public int TotalCases { get; set; }
    public int OpenCasesCount { get; set; }
    public int UpcomingSessionsCount { get; set; }
    
    public decimal TotalInvoiced { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal PendingBalance { get; set; }
    public int OverdueInvoicesCount { get; set; }
    
    public int TotalDocuments { get; set; }
    
    public List<ChartDataPoint> CasesByStatus { get; set; } = new();
    public List<MonthlyFinancialPoint> Last6MonthsFinance { get; set; } = new();
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
