using LawOffice.Application.DTOs.Finance;
using LawOffice.Domain.Enums;

namespace LawOffice.Application.Interfaces.Services;

public interface IInvoiceService
{
    Task<IEnumerable<InvoiceListDto>> GetInvoicesAsync(Guid? caseId = null, InvoiceStatus? status = null);
    Task<InvoiceDetailDto?> GetInvoiceByIdAsync(Guid id);
    Task<InvoiceDetailDto> CreateInvoiceAsync(CreateInvoiceDto dto, Guid createdBy);
    Task UpdateInvoiceAsync(Guid id, UpdateInvoiceDto dto);
    Task DeleteInvoiceAsync(Guid id);
    Task UpdateInvoiceStatusAsync(Guid id);
}

public interface IPaymentService
{
    Task<IEnumerable<PaymentListDto>> GetPaymentsAsync(Guid? caseId = null, Guid? invoiceId = null);
    Task<PaymentListDto?> GetPaymentByIdAsync(Guid id);
    Task<PaymentListDto> CreatePaymentAsync(CreatePaymentDto dto, Guid createdBy);
    Task UpdatePaymentAsync(Guid id, UpdatePaymentDto dto);
    Task DeletePaymentAsync(Guid id);
}

public interface IFinanceService
{
    Task<FinancialSummaryDto> GetGlobalSummaryAsync();
    Task<FinancialSummaryDto> GetCaseSummaryAsync(Guid caseId);
}
