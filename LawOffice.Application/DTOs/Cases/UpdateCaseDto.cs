using System.ComponentModel.DataAnnotations;
using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Cases;

public class UpdateCaseDto
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    [StringLength(50)]
    public string CaseNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Required]
    public CaseStatus Status { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    public DateTime? ClosedDate { get; set; }

    public string? Notes { get; set; }

    [Required]
    public Guid ClientId { get; set; }

    [Required]
    public Guid AssignedLawyerId { get; set; }
}
