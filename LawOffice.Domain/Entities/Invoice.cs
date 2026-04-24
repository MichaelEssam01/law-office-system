using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class Invoice : BaseEntity
{
    public Guid CaseId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Unpaid;
    public string? Notes { get; set; }
    
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public virtual Case? Case { get; set; }
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
