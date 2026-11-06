using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Cases;

public class CaseDetailDto
{
    public Guid Id { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string Description { get; set; } = string.Empty;
    public CaseStatus Status { get; set; }
    public ArchivingType? ArchivingType { get; set; }
    
    // Dates
    public DateTime? AgreementDate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? CourtFilingDate { get; set; }
    public DateTime? ClosedDate { get; set; }
    
    // Type & Subtype
    public CaseType? CaseType { get; set; }
    public FamilyCaseSubtype? FamilyCaseSubtype { get; set; }
    
    // Court Data
    public string? CourtCaseNumber { get; set; }
    public YearType? YearType { get; set; }
    public int? Year { get; set; }
    public LitigationDegree? LitigationDegree { get; set; }
    
    // File
    public string? FileNumber { get; set; }
    public int? FileYear { get; set; }
    public string? FileColor { get; set; }
    
    // Outcome & Notes
    public string? JudgmentResult { get; set; }
    public DateTime? JudgmentDate { get; set; }
    public string? Notes { get; set; }

    // إجراءات القضية وأسباب التعليق
    public string? OfficeAction { get; set; }
    public string? CourtAction { get; set; }
    public string? ExternalAction { get; set; }
    public string? OtherAction { get; set; }
    public bool? HasOfficeAction { get; set; }
    public bool? HasCourtAction { get; set; }
    public bool? HasExternalAction { get; set; }
    public bool? HasOtherAction { get; set; }
    public string? SuspensionReason { get; set; }
    public string? SuspensionDocumentsText { get; set; }
    public string? SuspensionOtherText { get; set; }

    // Primary Client & Lawyer
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    
    public Guid? AssignedLawyerId { get; set; }
    public string? LawyerName { get; set; } = string.Empty;
    
    // Parties (Clients & Opponents)
    public List<CasePartyDto> Parties { get; set; } = new();

    public DateTime CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
