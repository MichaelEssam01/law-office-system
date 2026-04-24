using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Sessions;

public class SessionListDto
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public string CaseTitle { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public SessionStatus Status { get; set; }
}

public class SessionDetailDto : SessionListDto
{
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SessionCreateDto
{
    public Guid CaseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public SessionStatus Status { get; set; }
    public string? Notes { get; set; }
}

public class SessionUpdateDto : SessionCreateDto
{
}
