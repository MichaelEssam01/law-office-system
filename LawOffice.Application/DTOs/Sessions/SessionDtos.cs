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
    public string? Location { get; set; }
    public string? CircuitNumber { get; set; }
    public SessionStatus Status { get; set; }
    public Guid? AssignedLawyerId { get; set; }
    public string? AssignedLawyerName { get; set; }
    public string? CurrentSessionRole { get; set; }
    public string? DecisionKey { get; set; }
    public string? DecisionText { get; set; }
}

public class SessionDetailDto : SessionListDto
{
    // الجلسة السابقة
    public string? PreviousSessionRole { get; set; }
    public string? PostponementReason { get; set; }
    public Guid? PreviousSessionLawyerId { get; set; }
    public string? PreviousSessionLawyerName { get; set; }

    // ما تم في الجلسة والملاحظات
    public string? SessionProceedings { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SessionCreateDto
{
    public Guid CaseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? CircuitNumber { get; set; }
    public SessionStatus Status { get; set; } = SessionStatus.Scheduled;

    // الجلسة الحالية
    public string? CurrentSessionRole { get; set; }
    public Guid? AssignedLawyerId { get; set; }

    // الجلسة السابقة
    public string? PreviousSessionRole { get; set; }
    public string? PostponementReason { get; set; }
    public Guid? PreviousSessionLawyerId { get; set; }

    // ما تم في الجلسة والقرار والملاحظات
    public string? SessionProceedings { get; set; }
    public string? DecisionKey { get; set; }
    public string? DecisionText { get; set; }
    public string? Notes { get; set; }
}

public class SessionUpdateDto : SessionCreateDto
{
}
