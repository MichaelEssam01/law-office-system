namespace LawOffice.Application.DTOs.Profile;

public class SecurityLogDto
{
    public string Event { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Device { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class NotificationSettingsDto
{
    public bool EmailCases { get; set; }
    public bool EmailSessions { get; set; }
    public bool EmailFinance { get; set; }
    public bool AppCases { get; set; }
    public bool AppSessions { get; set; }
    public bool AppFinance { get; set; }
}
