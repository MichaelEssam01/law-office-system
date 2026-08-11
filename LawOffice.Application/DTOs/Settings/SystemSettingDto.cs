namespace LawOffice.Application.DTOs.Settings;

public class SystemSettingDto
{
    public string FirmName { get; set; } = string.Empty;
    public string LawyerName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? TaxNumber { get; set; }
}
