using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Cases;

public class CaseListDto
{
    public Guid Id { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public CaseStatus Status { get; set; }
    public ArchivingType? ArchivingType { get; set; }
    public CaseType? CaseType { get; set; }
    public FamilyCaseSubtype? FamilyCaseSubtype { get; set; }
    public LitigationDegree? LitigationDegree { get; set; }
    public string? CourtCaseNumber { get; set; }
    public YearType? YearType { get; set; }
    public int? Year { get; set; }
    public string? FileNumber { get; set; }
    public int? FileYear { get; set; }
    public string? FileColor { get; set; }
    public bool? HasOfficeAction { get; set; }
    public bool? HasCourtAction { get; set; }
    public bool? HasExternalAction { get; set; }
    public bool? HasOtherAction { get; set; }
    public string? SuspensionReason { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public int ClientNumber { get; set; }
    public string? OpponentName { get; set; }
    public string? LawyerName { get; set; } = string.Empty;
    public Guid ClientId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? ClosedDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
