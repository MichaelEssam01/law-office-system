using LawOffice.Application.DTOs.Finance;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using LawOffice.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Application.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IUnitOfWork _unitOfWork;

    public InvoiceService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<InvoiceListDto>> GetInvoicesAsync(Guid? caseId = null, InvoiceStatus? status = null)
    {
        var query = _unitOfWork.Repository<Invoice>().Query()
            .Include(i => i.Case)
                .ThenInclude(c => c!.Client)
            .Include(i => i.Payments)
            .AsQueryable();

        if (caseId.HasValue) query = query.Where(i => i.CaseId == caseId.Value);
        if (status.HasValue) query = query.Where(i => i.Status == status.Value);

        return await query
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvoiceListDto
            {
                Id = i.Id,
                CaseId = i.CaseId,
                ClientId = i.Case!.ClientId,
                ClientName = i.Case.Client != null ? i.Case.Client.FullName : string.Empty,
                CaseNumber = i.Case!.CaseNumber,
                CaseTitle = i.Case!.Title,
                InvoiceNumber = i.InvoiceNumber,
                Title = i.Title,
                Amount = i.Amount,
                PaidAmount = i.Payments.Sum(p => p.Amount),
                RemainingAmount = i.Amount - i.Payments.Sum(p => p.Amount),
                DueDate = i.DueDate,
                Status = i.Status,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<InvoiceDetailDto?> GetInvoiceByIdAsync(Guid id)
    {
        var i = await _unitOfWork.Repository<Invoice>().Query()
            .Include(i => i.Case)
                .ThenInclude(c => c!.Client)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (i == null) return null;

        return new InvoiceDetailDto
        {
            Id = i.Id,
            CaseId = i.CaseId,
            ClientId = i.Case!.ClientId,
            ClientName = i.Case.Client != null ? i.Case.Client.FullName : string.Empty,
            CaseNumber = i.Case!.CaseNumber,
            CaseTitle = i.Case!.Title,
            InvoiceNumber = i.InvoiceNumber,
            Title = i.Title,
            Amount = i.Amount,
            PaidAmount = i.Payments.Sum(p => p.Amount),
            RemainingAmount = i.Amount - i.Payments.Sum(p => p.Amount),
            DueDate = i.DueDate,
            Status = i.Status,
            CreatedAt = i.CreatedAt,
            Notes = i.Notes,
            Payments = i.Payments.Select(p => new PaymentListDto
            {
                Id = p.Id,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                Method = p.Method,
                Notes = p.Notes
            })
        };
    }

    public async Task<InvoiceDetailDto> CreateInvoiceAsync(CreateInvoiceDto dto, Guid createdBy)
    {
        string invoiceNumber = dto.InvoiceNumber ?? string.Empty;

        // Auto-generate invoice number if not provided
        if (string.IsNullOrWhiteSpace(invoiceNumber))
        {
            var totalCount = await _unitOfWork.Repository<Invoice>().Query().CountAsync();
            invoiceNumber = $"INV-{totalCount + 1:D4}";
            
            // Safety check for collisions
            while (await _unitOfWork.Repository<Invoice>().Query().AnyAsync(i => i.InvoiceNumber == invoiceNumber))
            {
                totalCount++;
                invoiceNumber = $"INV-{totalCount + 1:D4}";
            }
        }
        else
        {
            // Validation: Unique InvoiceNumber if provided manually
            var exists = await _unitOfWork.Repository<Invoice>().Query().AnyAsync(i => i.InvoiceNumber == invoiceNumber);
            if (exists) throw new Exception("Invoice number already exists");
        }

        // Validation: Amount > 0
        if (dto.Amount <= 0) throw new Exception("Amount must be greater than 0");

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            CaseId = dto.CaseId,
            InvoiceNumber = invoiceNumber,
            Title = dto.Title,
            Amount = dto.Amount,
            DueDate = dto.DueDate,
            Notes = dto.Notes,
            Status = InvoiceStatus.Unpaid,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        await _unitOfWork.Repository<Invoice>().AddAsync(invoice);
        await _unitOfWork.CompleteAsync();

        return await GetInvoiceByIdAsync(invoice.Id) ?? throw new Exception("Failed to retrieve created invoice");
    }

    public async Task UpdateInvoiceAsync(Guid id, UpdateInvoiceDto dto)
    {
        var invoice = await _unitOfWork.Repository<Invoice>().GetByIdAsync(id);
        if (invoice == null) throw new Exception("Invoice not found");

        invoice.Title = dto.Title;
        invoice.Amount = dto.Amount;
        invoice.DueDate = dto.DueDate;
        invoice.Notes = dto.Notes;
        invoice.Status = dto.Status;
        invoice.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Repository<Invoice>().Update(invoice);
        await _unitOfWork.CompleteAsync();
        
        await UpdateInvoiceStatusAsync(id);
    }

    public async Task DeleteInvoiceAsync(Guid id)
    {
        var invoice = await _unitOfWork.Repository<Invoice>().GetByIdAsync(id);
        if (invoice == null) throw new Exception("Invoice not found");

        _unitOfWork.Repository<Invoice>().Delete(invoice);
        await _unitOfWork.CompleteAsync();
    }

    public async Task UpdateInvoiceStatusAsync(Guid id)
    {
        var invoice = await _unitOfWork.Repository<Invoice>().Query()
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null) return;

        var paidAmount = invoice.Payments.Sum(p => p.Amount);

        if (paidAmount >= invoice.Amount && invoice.Amount > 0)
        {
            invoice.Status = InvoiceStatus.Paid;
        }
        else if (paidAmount > 0)
        {
            invoice.Status = InvoiceStatus.PartiallyPaid;
        }
        else if (invoice.Status == InvoiceStatus.Cancelled)
        {
            // Keep it cancelled if the user manually set it and there are no payments
            invoice.Status = InvoiceStatus.Cancelled;
        }
        else if (invoice.DueDate < DateTime.UtcNow)
        {
            invoice.Status = InvoiceStatus.Overdue;
        }
        else
        {
            invoice.Status = InvoiceStatus.Unpaid;
        }

        _unitOfWork.Repository<Invoice>().Update(invoice);
        await _unitOfWork.CompleteAsync();
    }
}
