using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Cases;

public class CasePartyDto
{
    public Guid? Id { get; set; }
    public PartyType PartyType { get; set; } // Client or Opponent
    public Guid? ClientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public PartyCapacity Capacity { get; set; }
    public DisputeNature DisputeNature { get; set; }
    public bool HasSameCapacityOthers { get; set; }
    public string? OtherPersonName { get; set; }
    public string? OtherLawyerName { get; set; }
    public string? OpponentLawyerName { get; set; }
}
