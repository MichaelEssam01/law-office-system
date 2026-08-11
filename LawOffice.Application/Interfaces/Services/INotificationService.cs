using LawOffice.Application.DTOs.Notifications;

namespace LawOffice.Application.Interfaces.Services;

public interface INotificationService
{
    Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(Guid userId, int count = 20);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task MarkAsReadAsync(Guid notificationId);
    Task MarkAllAsReadAsync(Guid userId);
    Task CreateNotificationAsync(Guid userId, string title, string message, string type, string? link = null, Dictionary<string, string>? parameters = null);
}
