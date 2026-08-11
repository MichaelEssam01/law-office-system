using LawOffice.Domain.Common;

namespace LawOffice.Domain.Entities;

public class SystemSetting : BaseEntity
{
    public string FirmName { get; set; } = string.Empty;
    public string LawyerName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? TaxNumber { get; set; }
}
