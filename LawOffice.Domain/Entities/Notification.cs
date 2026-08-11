using LawOffice.Domain.Common;

namespace LawOffice.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Cases, Sessions, Finance
    public bool IsRead { get; set; }
    public string? Link { get; set; }
    public string? ParametersJson { get; set; }
}
