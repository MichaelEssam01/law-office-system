using LawOffice.Application.DTOs.Profile;

namespace LawOffice.Application.Interfaces.Services;

public interface IUserProfileService
{
    Task<IEnumerable<SecurityLogDto>> GetSecurityLogsAsync(Guid userId);
    Task<NotificationSettingsDto> GetNotificationSettingsAsync(Guid userId);
    Task UpdateNotificationSettingsAsync(Guid userId, NotificationSettingsDto settings);
    Task AddSecurityLogAsync(Guid userId, string @event, string device, string ip, string status = "Success");
    Task<byte[]> ExportSecurityLogsCsvAsync(Guid userId);
}
