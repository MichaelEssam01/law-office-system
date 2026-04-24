using System.ComponentModel.DataAnnotations;
using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Cases;

public class CreateCaseDto
{
    [Required]
    [StringLength(50)]
    public string CaseNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Required]
    public CaseStatus Status { get; set; } = CaseStatus.Open;

    [Required]
    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    public string? Notes { get; set; }

    [Required]
    public Guid ClientId { get; set; }

    [Required]
    public Guid AssignedLawyerId { get; set; }
}
