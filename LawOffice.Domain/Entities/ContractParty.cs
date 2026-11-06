using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class ContractParty : BaseEntity
{
    public Guid ContractId { get; set; }
    public Contract Contract { get; set; } = null!;

    public PartyType PartyType { get; set; } // Client or Opponent (Other Party)

    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }

    public string Name { get; set; } = string.Empty;
    public PartyCapacity Capacity { get; set; } = PartyCapacity.Plaintiff;

    // آخرين بذات الصفة
    public bool HasSameCapacityOthers { get; set; }
    public string? OtherPersonName { get; set; }
    public string? OtherLawyerName { get; set; }

    // محامي الطرف الآخر
    public string? OpponentLawyerName { get; set; }
}

