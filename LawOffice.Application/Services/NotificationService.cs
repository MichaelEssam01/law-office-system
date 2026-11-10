using LawOffice.Application.Common.Security;
using LawOffice.Application.DTOs.Notifications;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using LawOffice.Application.Hubs;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace LawOffice.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;

    public NotificationService(
        IUnitOfWork unitOfWork,
        IHubContext<NotificationHub> hubContext,
        UserManager<User> userManager,
        RoleManager<IdentityRole<Guid>> roleManager)
    {
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(Guid userId, int count = 20)
    {
        await EnsureInitialNotificationsAsync(userId);

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
        await EnsureInitialNotificationsAsync(userId);

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

    public async Task NotifyUserAndAdminsAsync(Guid? targetUserId, string title, string message, string type, string? link = null, Dictionary<string, string>? parameters = null)
    {
        var recipientIds = new HashSet<Guid>();
        string? assignedLawyerName = null;

        if (targetUserId.HasValue && targetUserId.Value != Guid.Empty)
        {
            recipientIds.Add(targetUserId.Value);
            var targetUser = await _userManager.FindByIdAsync(targetUserId.Value.ToString());
            assignedLawyerName = targetUser?.FullName;
        }

        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        foreach (var admin in admins.Where(a => a.IsActive))
        {
            recipientIds.Add(admin.Id);
        }

        foreach (var recipientId in recipientIds)
        {
            var isAssignedUser = targetUserId.HasValue && recipientId == targetUserId.Value;
            var msgParams = parameters != null
                ? new Dictionary<string, string>(parameters)
                : new Dictionary<string, string>();

            if (!string.IsNullOrWhiteSpace(assignedLawyerName))
            {
                msgParams["lawyer"] = assignedLawyerName;
            }

            var effectiveMessage = isAssignedUser
                ? message
                : GetAdminMessageKey(message, !string.IsNullOrWhiteSpace(assignedLawyerName));

            await CreateNotificationAsync(recipientId, title, effectiveMessage, type, link, msgParams);
        }
    }

    private static string GetAdminMessageKey(string message, bool hasAssignedLawyer)
    {
        return message switch
        {
            "NOTIFICATIONS.CASE_ASSIGNED_MSG" => hasAssignedLawyer
                ? "NOTIFICATIONS.ADMIN_CASE_ASSIGNED_MSG"
                : "NOTIFICATIONS.ADMIN_CASE_CREATED_MSG",
            "NOTIFICATIONS.CONTRACT_ASSIGNED_MSG" => hasAssignedLawyer
                ? "NOTIFICATIONS.ADMIN_CONTRACT_ASSIGNED_MSG"
                : "NOTIFICATIONS.CONTRACT_ASSIGNED_MSG",
            "NOTIFICATIONS.REGISTRATION_ASSIGNED_MSG" => hasAssignedLawyer
                ? "NOTIFICATIONS.ADMIN_REGISTRATION_ASSIGNED_MSG"
                : "NOTIFICATIONS.REGISTRATION_ASSIGNED_MSG",
            "NOTIFICATIONS.COMPANY_ASSIGNED_MSG" => hasAssignedLawyer
                ? "NOTIFICATIONS.ADMIN_COMPANY_ASSIGNED_MSG"
                : "NOTIFICATIONS.COMPANY_ASSIGNED_MSG",
            "NOTIFICATIONS.SESSION_SCHEDULED_MSG" => hasAssignedLawyer
                ? "NOTIFICATIONS.ADMIN_SESSION_SCHEDULED_MSG"
                : "NOTIFICATIONS.SESSION_SCHEDULED_MSG",
            _ => message
        };
    }

    private async Task EnsureInitialNotificationsAsync(Guid userId)
    {
        // Upgrade any previously seeded notifications for this user that used CASE_ASSIGNED_MSG when another lawyer was assigned
        var existingWrongNotifs = await _unitOfWork.Repository<Notification>().Query()
            .Where(n => n.UserId == userId && n.Message == "NOTIFICATIONS.CASE_ASSIGNED_MSG" && n.Link != null && n.Link.StartsWith("/cases/"))
            .ToListAsync();

        if (existingWrongNotifs.Any())
        {
            bool updatedAny = false;
            foreach (var n in existingWrongNotifs)
            {
                var caseIdStr = n.Link!.Replace("/cases/", "");
                if (Guid.TryParse(caseIdStr, out var caseId))
                {
                    var c = await _unitOfWork.Repository<Case>().Query()
                        .Include(x => x.AssignedLawyer)
                        .AsNoTracking()
                        .FirstOrDefaultAsync(x => x.Id == caseId);

                    if (c != null && c.AssignedLawyerId != userId)
                    {
                        var dict = !string.IsNullOrEmpty(n.ParametersJson)
                            ? JsonSerializer.Deserialize<Dictionary<string, string>>(n.ParametersJson) ?? new Dictionary<string, string>()
                            : new Dictionary<string, string>();

                        if (c.AssignedLawyer != null)
                        {
                            dict["lawyer"] = c.AssignedLawyer.FullName;
                            n.Message = "NOTIFICATIONS.ADMIN_CASE_ASSIGNED_MSG";
                        }
                        else
                        {
                            n.Message = "NOTIFICATIONS.ADMIN_CASE_CREATED_MSG";
                        }
                        n.ParametersJson = JsonSerializer.Serialize(dict);
                        _unitOfWork.Repository<Notification>().Update(n);
                        updatedAny = true;
                    }
                }
            }
            if (updatedAny)
            {
                await _unitOfWork.CompleteAsync();
            }
        }

        var hasAny = await _unitOfWork.Repository<Notification>().Query()
            .AnyAsync(n => n.UserId == userId);
        if (hasAny) return;

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return;

        var userRoles = await _userManager.GetRolesAsync(user);
        bool canViewAllCases = false;
        foreach (var roleName in userRoles)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role != null)
            {
                var claims = await _roleManager.GetClaimsAsync(role);
                if (claims.Any(c => c.Type == "Permission" && c.Value == Permissions.Cases.ViewAll))
                {
                    canViewAllCases = true;
                    break;
                }
            }
        }

        var casesQuery = _unitOfWork.Repository<Case>().Query()
            .Include(c => c.AssignedLawyer)
            .AsNoTracking();
        if (!canViewAllCases)
        {
            casesQuery = casesQuery.Where(c => c.AssignedLawyerId == userId);
        }

        var recentCases = await casesQuery
            .OrderByDescending(c => c.CreatedAt)
            .Take(3)
            .ToListAsync();

        var seeded = new List<Notification>();
        foreach (var c in recentCases)
        {
            bool isSelfAssigned = c.AssignedLawyerId.HasValue && c.AssignedLawyerId.Value == userId;
            var msgKey = isSelfAssigned
                ? "NOTIFICATIONS.CASE_ASSIGNED_MSG"
                : (c.AssignedLawyer != null ? "NOTIFICATIONS.ADMIN_CASE_ASSIGNED_MSG" : "NOTIFICATIONS.ADMIN_CASE_CREATED_MSG");

            var paramDict = new Dictionary<string, string>
            {
                { "number", c.CaseNumber },
                { "title", c.Title }
            };
            if (c.AssignedLawyer != null)
            {
                paramDict["lawyer"] = c.AssignedLawyer.FullName;
            }

            seeded.Add(new Notification
            {
                UserId = userId,
                Title = "NOTIFICATIONS.CASE_ASSIGNED_TITLE",
                Message = msgKey,
                Type = "Cases",
                Link = $"/cases/{c.Id}",
                IsRead = false,
                CreatedAt = c.CreatedAt,
                ParametersJson = JsonSerializer.Serialize(paramDict)
            });
        }

        var sessionsQuery = _unitOfWork.Repository<Session>().Query()
            .Include(s => s.Case)
            .Include(s => s.AssignedLawyer)
            .AsNoTracking();
        if (!canViewAllCases)
        {
            sessionsQuery = sessionsQuery.Where(s => s.AssignedLawyerId == userId);
        }

        var recentSessions = await sessionsQuery
            .OrderByDescending(s => s.ScheduledAt)
            .Take(2)
            .ToListAsync();

        foreach (var s in recentSessions)
        {
            bool isSelfAssigned = s.AssignedLawyerId.HasValue && s.AssignedLawyerId.Value == userId;
            var msgKey = (!isSelfAssigned && s.AssignedLawyer != null)
                ? "NOTIFICATIONS.ADMIN_SESSION_SCHEDULED_MSG"
                : "NOTIFICATIONS.SESSION_SCHEDULED_MSG";

            var paramDict = new Dictionary<string, string>
            {
                { "number", s.Case?.CaseNumber ?? "" },
                { "court", s.CourtName }
            };
            if (s.AssignedLawyer != null)
            {
                paramDict["lawyer"] = s.AssignedLawyer.FullName;
            }

            seeded.Add(new Notification
            {
                UserId = userId,
                Title = "NOTIFICATIONS.SESSION_SCHEDULED_TITLE",
                Message = msgKey,
                Type = "Sessions",
                Link = $"/cases/{s.CaseId}",
                IsRead = false,
                CreatedAt = s.CreatedAt,
                ParametersJson = JsonSerializer.Serialize(paramDict)
            });
        }

        if (canViewAllCases)
        {
            var recentPayments = await _unitOfWork.Repository<Payment>().Query()
                .Include(p => p.Case)
                .AsNoTracking()
                .OrderByDescending(p => p.PaymentDate)
                .Take(2)
                .ToListAsync();

            foreach (var p in recentPayments)
            {
                seeded.Add(new Notification
                {
                    UserId = userId,
                    Title = "NOTIFICATIONS.PAYMENT_RECORDED_TITLE",
                    Message = "NOTIFICATIONS.PAYMENT_RECORDED_MSG",
                    Type = "Finance",
                    Link = $"/cases/{p.CaseId}",
                    IsRead = false,
                    CreatedAt = p.CreatedAt,
                    ParametersJson = JsonSerializer.Serialize(new Dictionary<string, string>
                    {
                        { "amount", p.Amount.ToString("N0") },
                        { "number", p.Case?.CaseNumber ?? "" }
                    })
                });
            }
        }

        if (seeded.Any())
        {
            foreach (var n in seeded)
            {
                await _unitOfWork.Repository<Notification>().AddAsync(n);
            }
            await _unitOfWork.CompleteAsync();
        }
    }
}
