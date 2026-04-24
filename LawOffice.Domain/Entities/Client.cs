using LawOffice.Domain.Common;

namespace LawOffice.Domain.Entities;

public class Client : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public ICollection<Case> Cases { get; set; } = new List<Case>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
