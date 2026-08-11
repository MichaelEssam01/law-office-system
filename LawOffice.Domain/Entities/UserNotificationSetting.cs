using System.ComponentModel.DataAnnotations;
using LawOffice.Domain.Common;

namespace LawOffice.Domain.Entities;

public class UserNotificationSetting : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public bool EmailCases { get; set; } = true;
    public bool EmailSessions { get; set; } = true;
    public bool EmailFinance { get; set; } = false;

    public bool AppCases { get; set; } = true;
    public bool AppSessions { get; set; } = true;
    public bool AppFinance { get; set; } = true;
}
