using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Finance;

// Invoice DTOs
public class InvoiceListDto
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public string CaseTitle { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount => Amount - PaidAmount;
    public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class InvoiceDetailDto : InvoiceListDto
{
    public string? Notes { get; set; }
    public IEnumerable<PaymentListDto> Payments { get; set; } = new List<PaymentListDto>();
}

public class CreateInvoiceDto
{
    public Guid CaseId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string? Notes { get; set; }
}

public class UpdateInvoiceDto
{
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string? Notes { get; set; }
    public InvoiceStatus Status { get; set; }
}

// Payment DTOs
public class PaymentListDto
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public Guid? InvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public PaymentMethod Method { get; set; }
    public string? Notes { get; set; }
}

public class CreatePaymentDto
{
    public Guid CaseId { get; set; }
    public Guid? InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public PaymentMethod Method { get; set; }
    public string? Notes { get; set; }
}

public class UpdatePaymentDto
{
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public PaymentMethod Method { get; set; }
    public string? Notes { get; set; }
}

// Summary DTO
public class FinancialSummaryDto
{
    public decimal TotalInvoiced { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalRemaining => TotalInvoiced - TotalPaid;
    public int UnpaidInvoicesCount { get; set; }
    public int OverdueInvoicesCount { get; set; }
}
