using LawOffice.Application.DTOs.Notifications;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using LawOffice.Application.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace LawOffice.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(IUnitOfWork unitOfWork, IHubContext<NotificationHub> hubContext)
    {
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
    }

    public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(Guid userId, int count = 20)
    {
        var notifications = await _unitOfWork.Repository<Notification>().Query()
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(count)
            .ToListAsync();

        return notifications.Select(n => new NotificationDto
        {
            Id = n.Id,
            Title = n.Title,
            Message = n.Message,
            Type = n.Type,
            IsRead = n.IsRead,
            Link = n.Link,
            CreatedAt = n.CreatedAt,
            Parameters = !string.IsNullOrEmpty(n.ParametersJson) 
                ? JsonSerializer.Deserialize<Dictionary<string, string>>(n.ParametersJson) 
                : null
        });
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _unitOfWork.Repository<Notification>().Query()
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        var notification = await _unitOfWork.Repository<Notification>().GetByIdAsync(notificationId);
        if (notification != null)
        {
            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Repository<Notification>().Update(notification);
            await _unitOfWork.CompleteAsync();
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var unreadNotifications = await _unitOfWork.Repository<Notification>().Query()
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Repository<Notification>().Update(notification);
        }

        await _unitOfWork.CompleteAsync();
    }

    public async Task CreateNotificationAsync(Guid userId, string title, string message, string type, string? link = null, Dictionary<string, string>? parameters = null)
    {
        // Check user settings
        var settings = await _unitOfWork.Repository<UserNotificationSetting>().Query()
            .FirstOrDefaultAsync(s => s.UserId == userId);

        bool shouldSend = type switch
        {
            "Cases" => settings?.AppCases ?? true,
            "Sessions" => settings?.AppSessions ?? true,
            "Finance" => settings?.AppFinance ?? true,
            _ => true
        };

        if (!shouldSend) return;

        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            Link = link,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            ParametersJson = parameters != null ? JsonSerializer.Serialize(parameters) : null
        };

        await _unitOfWork.Repository<Notification>().AddAsync(notification);
        await _unitOfWork.CompleteAsync();

        // Send real-time notification via SignalR
        await _hubContext.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", new NotificationDto
        {
            Id = notification.Id,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type,
            IsRead = notification.IsRead,
            Link = notification.Link,
            CreatedAt = notification.CreatedAt,
            Parameters = parameters
        });
    }
}
