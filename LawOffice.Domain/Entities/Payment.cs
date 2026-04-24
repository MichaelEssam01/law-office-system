using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid CaseId { get; set; }
    public Guid? InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public PaymentMethod Method { get; set; }
    public string? Notes { get; set; }
    
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public virtual Case? Case { get; set; }
    public virtual Invoice? Invoice { get; set; }
}
