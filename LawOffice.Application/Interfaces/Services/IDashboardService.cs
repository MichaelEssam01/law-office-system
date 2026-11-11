using LawOffice.Application.DTOs.Dashboard;

namespace LawOffice.Application.Interfaces.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(Guid userId, List<string> roles, List<string> permissions);
}
