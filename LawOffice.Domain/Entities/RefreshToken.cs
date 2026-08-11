using LawOffice.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace LawOffice.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public string TokenHash { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public DateTime ExpiryDate { get; set; }
    public bool IsRevoked { get; set; }
    public bool IsUsed { get; set; }
    
    public string CreatedByIp { get; set; } = string.Empty;
    
    public DateTime? RevokedAt { get; set; }
    public string? RevokedByIp { get; set; }
    
    public string? DeviceInfo { get; set; }
    public string? ReplacedByToken { get; set; }

    public bool IsActive => !IsRevoked && !IsUsed && DateTime.UtcNow <= ExpiryDate;
}
