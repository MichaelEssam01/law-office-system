using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Cases;

public class CaseDetailDto
{
    public Guid Id { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public CaseStatus Status { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? ClosedDate { get; set; }
    public string? Notes { get; set; }
    
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    
    public Guid AssignedLawyerId { get; set; }
    public string LawyerName { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
