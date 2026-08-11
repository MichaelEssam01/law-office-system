using System.ComponentModel.DataAnnotations;

namespace LawOffice.Application.DTOs.Clients;

public class ClientDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
}

public class CreateClientDto
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    
    [RegularExpression(@"^\d{14}$", ErrorMessage = "National ID must be exactly 14 digits.")]
    public string NationalId { get; set; } = string.Empty;
}

public class UpdateClientDto
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    
    [RegularExpression(@"^\d{14}$", ErrorMessage = "National ID must be exactly 14 digits.")]
    public string NationalId { get; set; } = string.Empty;
}

public class ClientWorksDto
{
    public ClientDto Client { get; set; } = null!;
    public List<ClientCaseSummaryDto> Cases { get; set; } = new();
    public List<ClientSessionSummaryDto> Sessions { get; set; } = new();
    public List<ClientInvoiceSummaryDto> Invoices { get; set; } = new();
    public List<ClientDocumentSummaryDto> Documents { get; set; } = new();
}

public class ClientCaseSummaryDto
{
    public Guid Id { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string LawyerName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
}

public class ClientSessionSummaryDto
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class ClientInvoiceSummaryDto
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount => Amount - PaidAmount;
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<ClientPaymentSummaryDto> Payments { get; set; } = new();
}

public class ClientPaymentSummaryDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string Method { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class ClientDocumentSummaryDto
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime CreatedAt { get; set; }
}
