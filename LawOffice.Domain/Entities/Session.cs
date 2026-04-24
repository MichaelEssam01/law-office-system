using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class Session : BaseEntity
{
    public Guid CaseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public SessionStatus Status { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public virtual Case? Case { get; set; }
}
