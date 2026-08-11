using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Cases;

public class CaseListDto
{
    public Guid Id { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public CaseStatus Status { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string LawyerName { get; set; } = string.Empty;
    public Guid ClientId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
