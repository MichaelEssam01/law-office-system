using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Registrations;

public class RegistrationProcedureDto
{
    public Guid? Id { get; set; }
    public RegistrationProcedureType ProcedureType { get; set; }
    public DateTime? StartDate { get; set; }
    public string? CompletedWork { get; set; }
    public string? Obstacles { get; set; }
    public string? RequiredAction { get; set; }
    public Guid? ResponsibleLawyerId { get; set; }
    public string? ResponsibleLawyerName { get; set; }
    public string? Notes { get; set; }
}

public class RegistrationListDto
{
    public Guid Id { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public string AuthorityName { get; set; } = string.Empty;
    public RegistrationRequestType RequestType { get; set; }
    public string? OtherRequestType { get; set; }
    public string? FileNumber { get; set; }
    public int? FileYear { get; set; }
    public string? FileColor { get; set; }
    public string? ResultNumber { get; set; }
    public DateTime? ResultDate { get; set; }
    public string? ResultAuthority { get; set; }
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public int ClientNumber { get; set; }
    public Guid? AssignedLawyerId { get; set; }
    public string? LawyerName { get; set; }
    public List<RegistrationProcedureType> ActiveProcedures { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class RegistrationDetailDto : RegistrationListDto
{
    public string? Notes { get; set; }
    public List<RegistrationProcedureDto> Procedures { get; set; } = new();
    public Guid CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateRegistrationDto
{
    public string? RegistrationNumber { get; set; }
    public string AuthorityName { get; set; } = string.Empty;
    public RegistrationRequestType RequestType { get; set; }
    public string? OtherRequestType { get; set; }
    public string? FileNumber { get; set; }
    public int? FileYear { get; set; }
    public string? FileColor { get; set; }
    public string? ResultNumber { get; set; }
    public DateTime? ResultDate { get; set; }
    public string? ResultAuthority { get; set; }
    public string? Notes { get; set; }
    public Guid ClientId { get; set; }
    public Guid? AssignedLawyerId { get; set; }
    public List<RegistrationProcedureDto> Procedures { get; set; } = new();
}

public class UpdateRegistrationDto : CreateRegistrationDto
{
    public Guid Id { get; set; }
}

