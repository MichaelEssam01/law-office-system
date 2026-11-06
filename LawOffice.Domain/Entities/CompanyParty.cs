using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class CompanyParty : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public PartyType PartyType { get; set; }

    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }

    public string Name { get; set; } = string.Empty;
    public PartyCapacity Capacity { get; set; } = PartyCapacity.Plaintiff;
    public DisputeNature DisputeNature { get; set; } = DisputeNature.Original;

    public bool HasSameCapacityOthers { get; set; }
    public string? OtherPersonName { get; set; }
    public string? OtherLawyerName { get; set; }
    public string? OpponentLawyerName { get; set; }
}

