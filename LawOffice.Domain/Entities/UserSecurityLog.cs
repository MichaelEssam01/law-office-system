using System.ComponentModel.DataAnnotations;
using LawOffice.Domain.Common;

namespace LawOffice.Domain.Entities;

public class UserSecurityLog : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Event { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [MaxLength(200)]
    public string Device { get; set; } = string.Empty;

    [MaxLength(50)]
    public string IpAddress { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Success";
}
