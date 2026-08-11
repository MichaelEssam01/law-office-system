using LawOffice.Domain.Common;

namespace LawOffice.Domain.Entities;

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string IPAddress { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
    public string? AdditionalData { get; set; } // JSON string
}
