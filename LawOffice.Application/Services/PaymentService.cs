using LawOffice.Application.DTOs.Finance;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IInvoiceService _invoiceService;
    private readonly IFinanceService _financeService;

    public PaymentService(IUnitOfWork unitOfWork, IInvoiceService invoiceService, IFinanceService financeService)
    {
        _unitOfWork = unitOfWork;
        _invoiceService = invoiceService;
        _financeService = financeService;
    }

    public async Task<IEnumerable<PaymentListDto>> GetPaymentsAsync(Guid? caseId = null, Guid? invoiceId = null)
    {
        var query = _unitOfWork.Repository<Payment>().Query()
            .Include(p => p.Case)
            .Include(p => p.Invoice)
            .AsQueryable();

        if (caseId.HasValue) query = query.Where(p => p.CaseId == caseId.Value);
        if (invoiceId.HasValue) query = query.Where(p => p.InvoiceId == invoiceId.Value);

        return await query
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new PaymentListDto
            {
                Id = p.Id,
                CaseId = p.CaseId,
                CaseNumber = p.Case!.CaseNumber,
                InvoiceId = p.InvoiceId,
                InvoiceNumber = p.Invoice != null ? p.Invoice.InvoiceNumber : null,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                Method = p.Method,
                Notes = p.Notes
            })
            .ToListAsync();
    }

    public async Task<PaymentListDto?> GetPaymentByIdAsync(Guid id)
    {
        var p = await _unitOfWork.Repository<Payment>().Query()
            .Include(p => p.Case)
            .Include(p => p.Invoice)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p == null) return null;

        return new PaymentListDto
        {
            Id = p.Id,
            CaseId = p.CaseId,
            CaseNumber = p.Case!.CaseNumber,
            InvoiceId = p.InvoiceId,
            InvoiceNumber = p.Invoice != null ? p.Invoice.InvoiceNumber : null,
            Amount = p.Amount,
            PaymentDate = p.PaymentDate,
            Method = p.Method,
            Notes = p.Notes
        };
    }

    public async Task<PaymentListDto> CreatePaymentAsync(CreatePaymentDto dto, Guid createdBy)
    {
        // Validation: Amount > 0
        if (dto.Amount <= 0) throw new Exception("Payment amount must be greater than 0");

        if (dto.InvoiceId.HasValue)
        {
            var invoice = await _unitOfWork.Repository<Invoice>().Query()
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i => i.Id == dto.InvoiceId.Value);
            
            if (invoice == null) throw new Exception("Invoice not found");
            if (invoice.CaseId != dto.CaseId) throw new Exception("Invoice does not belong to the selected case");

            // Validation: Prevent overpayment for specific invoice
            var alreadyPaid = invoice.Payments.Sum(p => p.Amount);
            if (alreadyPaid + dto.Amount > invoice.Amount)
            {
                 throw new Exception($"Payment exceeds invoice balance. Remaining: {invoice.Amount - alreadyPaid}");
            }
        }
        else
        {
            // Validation: Prevent overpayment for the whole Case
            var summary = await _financeService.GetCaseSummaryAsync(dto.CaseId);
            if (dto.Amount > summary.TotalRemaining)
            {
                throw new Exception($"Payment exceeds total case balance. Remaining: {summary.TotalRemaining}");
            }
        }

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            CaseId = dto.CaseId,
            InvoiceId = dto.InvoiceId,
            Amount = dto.Amount,
            PaymentDate = dto.PaymentDate,
            Method = dto.Method,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        await _unitOfWork.Repository<Payment>().AddAsync(payment);
        await _unitOfWork.CompleteAsync();

        if (dto.InvoiceId.HasValue)
        {
            await _invoiceService.UpdateInvoiceStatusAsync(dto.InvoiceId.Value);
        }

        return await GetPaymentByIdAsync(payment.Id) ?? throw new Exception("Failed to retrieve created payment");
    }

    public async Task UpdatePaymentAsync(Guid id, UpdatePaymentDto dto)
    {
        var p = await _unitOfWork.Repository<Payment>().GetByIdAsync(id);
        if (p == null) throw new Exception("Payment not found");

        var oldInvoiceId = p.InvoiceId;
        p.Amount = dto.Amount;
        p.PaymentDate = dto.PaymentDate;
        p.Method = dto.Method;
        p.Notes = dto.Notes;
        p.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Repository<Payment>().Update(p);
        await _unitOfWork.CompleteAsync();

        if (oldInvoiceId.HasValue) await _invoiceService.UpdateInvoiceStatusAsync(oldInvoiceId.Value);
    }

    public async Task DeletePaymentAsync(Guid id)
    {
        var p = await _unitOfWork.Repository<Payment>().GetByIdAsync(id);
        if (p == null) throw new Exception("Payment not found");

        var invoiceId = p.InvoiceId;
        _unitOfWork.Repository<Payment>().Delete(p);
        await _unitOfWork.CompleteAsync();

        if (invoiceId.HasValue) await _invoiceService.UpdateInvoiceStatusAsync(invoiceId.Value);
    }
}
