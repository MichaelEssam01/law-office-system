using LawOffice.Application.DTOs.Dashboard;

namespace LawOffice.Application.Interfaces.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();
}
