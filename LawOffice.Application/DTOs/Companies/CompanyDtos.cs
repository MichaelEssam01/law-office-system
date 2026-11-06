using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Companies;

public class CompanyPartyDto
{
    public Guid? Id { get; set; }
    public PartyType PartyType { get; set; }
    public Guid? ClientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public PartyCapacity Capacity { get; set; }
    public DisputeNature DisputeNature { get; set; }
    public bool HasSameCapacityOthers { get; set; }
    public string? OtherPersonName { get; set; }
    public string? OtherLawyerName { get; set; }
    public string? OpponentLawyerName { get; set; }
}

public class CompanyListDto
{
    public Guid Id { get; set; }
    public string CompanyCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public CompanyStatus Status { get; set; }
    public CompanyType CompanyType { get; set; }
    public string? OtherCompanyType { get; set; }
    public string? CompanyNumber { get; set; }
    public string? CompanyDuration { get; set; }
    public string? AuthorityDetails { get; set; }
    public string? FileNumber { get; set; }
    public int? FileYear { get; set; }
    public string? FileColor { get; set; }
    public string? TaxNumber { get; set; }
    public string? Result { get; set; }
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public int ClientNumber { get; set; }
    public string? OpponentName { get; set; }
    public Guid? AssignedLawyerId { get; set; }
    public string? LawyerName { get; set; }
    public DateTime? AgreementDate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? FilingDate { get; set; }
    public DateTime? ClosedDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CompanyDetailDto : CompanyListDto
{
    public string? ContractProcedure { get; set; }
    public string? RegistryProcedure { get; set; }
    public string? RegistrationPlace { get; set; }
    public string? SubsequentProcedures { get; set; }
    public string? ValueAddedTax { get; set; }
    public string? Notes { get; set; }
    public List<CompanyPartyDto> Parties { get; set; } = new();
    public Guid CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateCompanyDto
{
    public string? CompanyCode { get; set; }
    public string Title { get; set; } = string.Empty;
    public CompanyStatus Status { get; set; } = CompanyStatus.Active;
    public DateTime? AgreementDate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? FilingDate { get; set; }
    public DateTime? ClosedDate { get; set; }
    public CompanyType CompanyType { get; set; }
    public string? OtherCompanyType { get; set; }
    public string? CompanyNumber { get; set; }
    public string? CompanyDuration { get; set; }
    public string? AuthorityDetails { get; set; }
    public string? FileNumber { get; set; }
    public int? FileYear { get; set; }
    public string? FileColor { get; set; }
    public string? ContractProcedure { get; set; }
    public string? RegistryProcedure { get; set; }
    public string? RegistrationPlace { get; set; }
    public string? SubsequentProcedures { get; set; }
    public string? TaxNumber { get; set; }
    public string? ValueAddedTax { get; set; }
    public string? Result { get; set; }
    public string? Notes { get; set; }
    public Guid ClientId { get; set; }
    public Guid? AssignedLawyerId { get; set; }
    public List<CompanyPartyDto> Parties { get; set; } = new();
}

public class UpdateCompanyDto : CreateCompanyDto
{
    public Guid Id { get; set; }
}

