using System.ComponentModel.DataAnnotations;
using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Cases;

public class CreateCaseDto
{
    [StringLength(50)]
    public string? CaseNumber { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Subject { get; set; }
    public string? Description { get; set; }

    [Required]
    public CaseStatus Status { get; set; } = CaseStatus.InProgress;

    public ArchivingType? ArchivingType { get; set; }

    // Dates
    public DateTime? AgreementDate { get; set; }
    [Required]
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? CourtFilingDate { get; set; }

    // Case Type
    [Required]
    public CaseType CaseType { get; set; }
    public FamilyCaseSubtype? FamilyCaseSubtype { get; set; }

    // Court Information
    public string? CourtCaseNumber { get; set; }
    public YearType? YearType { get; set; }
    public int? Year { get; set; }
    public LitigationDegree? LitigationDegree { get; set; }

    // File Archive
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

    [Required]
    public Guid ClientId { get; set; }

    public Guid? AssignedLawyerId { get; set; }

    // All parties (clients and opponents)
    public List<CasePartyDto> Parties { get; set; } = new();
}
