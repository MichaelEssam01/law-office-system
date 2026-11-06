using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class CaseParty : BaseEntity
{
    public Guid CaseId { get; set; }
    public Case Case { get; set; } = null!;

    public PartyType PartyType { get; set; } // Client or Opponent

    // If linked to existing Client system entity
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }

    // Name (either populated from Client or manual entry for Opponents / Clients)
    public string Name { get; set; } = string.Empty;

    // صفة العميل / الخصم
    public PartyCapacity Capacity { get; set; } = PartyCapacity.Plaintiff;

    // طبيعة الخصومة (أصلي / في المواجهة)
    public DisputeNature DisputeNature { get; set; } = DisputeNature.Original;

    // آخرين بذات الصفة (للعميل)
    public bool HasSameCapacityOthers { get; set; }
    public string? OtherPersonName { get; set; } // اسم الشخص (JSON list or formatted text for multiple persons)
    public string? OtherLawyerName { get; set; } // اسم المحامي

    // محامي الخصم (للخصم)
    public string? OpponentLawyerName { get; set; }
}
