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
    private static readonly SemaphoreSlim _seedLock = new(1, 1);
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

    public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(Guid userId, int count = 100)
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

            msgParams["scope"] = isAssignedUser ? "personal" : "system";

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
        await _seedLock.WaitAsync();
        try
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return;

            var userRoles = await _userManager.GetRolesAsync(user);
            bool isAdminUser = userRoles.Contains("Admin");
            if (!isAdminUser)
            {
                foreach (var roleName in userRoles)
                {
                    var role = await _roleManager.FindByNameAsync(roleName);
                    if (role != null)
                    {
                        var claims = await _roleManager.GetClaimsAsync(role);
                        if (claims.Any(c => c.Type == "Permission" && (c.Value == Permissions.Settings.Manage || c.Value == Permissions.Users.View)))
                        {
                            isAdminUser = true;
                            break;
                        }
                    }
                }
            }

            var existingUserNotifs = await _unitOfWork.Repository<Notification>().Query()
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            if (existingUserNotifs.Any())
            {
                bool updatedAny = false;
                var seenKeys = new HashSet<string>();

                foreach (var n in existingUserNotifs)
                {
                    var dict = !string.IsNullOrEmpty(n.ParametersJson)
                        ? JsonSerializer.Deserialize<Dictionary<string, string>>(n.ParametersJson) ?? new Dictionary<string, string>()
                        : new Dictionary<string, string>();

                    bool changedThis = false;

                    if (n.Message == "NOTIFICATIONS.CASE_ASSIGNED_MSG" && n.Link != null && n.Link.StartsWith("/cases/"))
                    {
                        var caseIdStr = n.Link.Replace("/cases/", "");
                        if (Guid.TryParse(caseIdStr, out var caseId))
                        {
                            var c = await _unitOfWork.Repository<Case>().Query()
                                .Include(x => x.AssignedLawyer)
                                .AsNoTracking()
                                .FirstOrDefaultAsync(x => x.Id == caseId);

                            if (c != null && c.AssignedLawyerId != userId)
                            {
                                if (c.AssignedLawyer != null)
                                {
                                    dict["lawyer"] = c.AssignedLawyer.FullName;
                                    n.Message = "NOTIFICATIONS.ADMIN_CASE_ASSIGNED_MSG";
                                }
                                else
                                {
                                    n.Message = "NOTIFICATIONS.ADMIN_CASE_CREATED_MSG";
                                }
                                dict["scope"] = "system";
                                changedThis = true;
                            }
                        }
                    }

                    if (!dict.ContainsKey("scope"))
                    {
                        bool isSystemMsg = n.Message.StartsWith("NOTIFICATIONS.ADMIN_")
                            || n.Message == "NOTIFICATIONS.PAYMENT_RECORDED_MSG"
                            || (isAdminUser && n.Message == "NOTIFICATIONS.SESSION_SCHEDULED_MSG");
                        dict["scope"] = isSystemMsg ? "system" : "personal";
                        changedThis = true;
                    }

                    var dedupKey = $"{n.Title}|{n.Message}|{n.Link}|{n.CreatedAt:O}";
                    if (!seenKeys.Add(dedupKey))
                    {
                        _unitOfWork.Repository<Notification>().Delete(n);
                        updatedAny = true;
                        continue;
                    }

                    if (changedThis)
                    {
                        n.ParametersJson = JsonSerializer.Serialize(dict);
                        _unitOfWork.Repository<Notification>().Update(n);
                        updatedAny = true;
                    }
                }

                if (updatedAny)
                {
                    await _unitOfWork.CompleteAsync();
                }
            }

            var existingKeys = new HashSet<string>(
                existingUserNotifs.Select(n => $"{n.Type}|{n.Link}|{n.CreatedAt:yyyy-MM-dd HH:mm:ss}")
            );

            var casesQuery = _unitOfWork.Repository<Case>().Query()
                .Include(c => c.AssignedLawyer)
                .AsNoTracking();
            if (!isAdminUser)
            {
                casesQuery = casesQuery.Where(c => c.AssignedLawyerId == userId);
            }

            var recentCases = await casesQuery
                .OrderByDescending(c => c.CreatedAt)
                .Take(50)
                .ToListAsync();

            var seeded = new List<Notification>();
            foreach (var c in recentCases)
            {
                var key = $"Cases|/cases/{c.Id}|{c.CreatedAt:yyyy-MM-dd HH:mm:ss}";
                if (!existingKeys.Add(key)) continue;

                bool isSelfAssigned = c.AssignedLawyerId.HasValue && c.AssignedLawyerId.Value == userId;
                var msgKey = isSelfAssigned
                    ? "NOTIFICATIONS.CASE_ASSIGNED_MSG"
                    : (c.AssignedLawyer != null ? "NOTIFICATIONS.ADMIN_CASE_ASSIGNED_MSG" : "NOTIFICATIONS.ADMIN_CASE_CREATED_MSG");

                var paramDict = new Dictionary<string, string>
                {
                    { "number", c.CaseNumber },
                    { "title", c.Title },
                    { "scope", isSelfAssigned ? "personal" : "system" }
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
            if (!isAdminUser)
            {
                sessionsQuery = sessionsQuery.Where(s => s.AssignedLawyerId == userId);
            }

            var recentSessions = await sessionsQuery
                .OrderByDescending(s => s.ScheduledAt)
                .Take(50)
                .ToListAsync();

            foreach (var s in recentSessions)
            {
                var key = $"Sessions|/cases/{s.CaseId}|{s.CreatedAt:yyyy-MM-dd HH:mm:ss}";
                if (!existingKeys.Add(key)) continue;

                bool isSelfAssigned = s.AssignedLawyerId.HasValue && s.AssignedLawyerId.Value == userId;
                var msgKey = (!isSelfAssigned && s.AssignedLawyer != null)
                    ? "NOTIFICATIONS.ADMIN_SESSION_SCHEDULED_MSG"
                    : "NOTIFICATIONS.SESSION_SCHEDULED_MSG";

                var paramDict = new Dictionary<string, string>
                {
                    { "number", s.Case?.CaseNumber ?? "" },
                    { "court", s.CourtName },
                    { "scope", isSelfAssigned ? "personal" : "system" }
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

            if (isAdminUser)
            {
                var recentPayments = await _unitOfWork.Repository<Payment>().Query()
                    .Include(p => p.Case)
                    .AsNoTracking()
                    .OrderByDescending(p => p.PaymentDate)
                    .Take(50)
                    .ToListAsync();

                foreach (var p in recentPayments)
                {
                    var key = $"Finance|/cases/{p.CaseId}|{p.CreatedAt:yyyy-MM-dd HH:mm:ss}";
                    if (!existingKeys.Add(key)) continue;

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
                            { "number", p.Case?.CaseNumber ?? "" },
                            { "scope", "system" }
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
        finally
        {
            _seedLock.Release();
        }
    }
}
