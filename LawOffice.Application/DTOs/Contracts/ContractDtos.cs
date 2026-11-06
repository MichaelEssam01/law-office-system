using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Contracts;

public class ContractPartyDto
{
    public Guid? Id { get; set; }
    public PartyType PartyType { get; set; }
    public Guid? ClientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public PartyCapacity Capacity { get; set; }
    public bool HasSameCapacityOthers { get; set; }
    public string? OtherPersonName { get; set; }
    public string? OtherLawyerName { get; set; }
    public string? OpponentLawyerName { get; set; }
}

public class ContractListDto
{
    public Guid Id { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public ContractStatus Status { get; set; }
    public ContractType ContractType { get; set; }
    public string? OtherContractType { get; set; }
    public string? FileNumber { get; set; }
    public int? FileYear { get; set; }
    public string? FileColor { get; set; }
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public int ClientNumber { get; set; }
    public string? OtherPartyName { get; set; }
    public Guid? AssignedLawyerId { get; set; }
    public string? LawyerName { get; set; }
    public DateTime? AgreementDate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? ClosedDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ContractDetailDto : ContractListDto
{
    public string? Notes { get; set; }
    public List<ContractPartyDto> Parties { get; set; } = new();
    public Guid CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateContractDto
{
    public string? ContractNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public ContractStatus Status { get; set; } = ContractStatus.InDrafting;
    public DateTime? AgreementDate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? ClosedDate { get; set; }
    public ContractType ContractType { get; set; }
    public string? OtherContractType { get; set; }
    public string? FileNumber { get; set; }
    public int? FileYear { get; set; }
    public string? FileColor { get; set; }
    public string? Notes { get; set; }
    public Guid ClientId { get; set; }
    public Guid? AssignedLawyerId { get; set; }
    public List<ContractPartyDto> Parties { get; set; } = new();
}

public class UpdateContractDto : CreateContractDto
{
    public Guid Id { get; set; }
}

