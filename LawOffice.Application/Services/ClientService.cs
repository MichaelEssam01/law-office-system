using LawOffice.Application.DTOs.Clients;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Application.Services;

public class ClientService : IClientService
{
    private readonly IRepository<Client> _clientRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditService _auditService;

    public ClientService(IRepository<Client> clientRepository, IUnitOfWork unitOfWork, IAuditService auditService)
    {
        _clientRepository = clientRepository;
        _unitOfWork = unitOfWork;
        _auditService = auditService;
    }

    public async Task<IEnumerable<ClientDto>> GetAllClientsAsync()
    {
        var clients = await _clientRepository.GetAllAsync();
        return clients.Select(MapToDto);
    }

    public async Task<ClientDto?> GetClientByIdAsync(Guid id)
    {
        var client = await _clientRepository.GetByIdAsync(id);
        if (client == null) return null;
        
        return MapToDto(client);
    }

    public async Task<ClientWorksDto?> GetClientWorksAsync(Guid id)
    {
        var client = await _clientRepository.GetByIdAsync(id);
        if (client == null) return null;

        var cases = await _unitOfWork.Repository<Case>().Query()
            .Include(c => c.AssignedLawyer)
            .Include(c => c.Sessions)
            .Include(c => c.Invoices)
                .ThenInclude(i => i.Payments)
            .Include(c => c.Documents)
            .Where(c => c.ClientId == id)
            .AsNoTracking()
            .ToListAsync();

        var worksDto = new ClientWorksDto
        {
            Client = MapToDto(client),
            Cases = cases.Select(c => new ClientCaseSummaryDto
            {
                Id = c.Id,
                CaseNumber = c.CaseNumber,
                Title = c.Title,
                Status = c.Status.ToString(),
                LawyerName = c.AssignedLawyer?.FullName ?? string.Empty,
                StartDate = c.StartDate
            }).ToList(),
            Sessions = cases.SelectMany(c => c.Sessions.Select(s => new ClientSessionSummaryDto
            {
                Id = s.Id,
                CaseId = c.Id,
                CaseNumber = c.CaseNumber,
                Title = s.Title,
                ScheduledAt = s.ScheduledAt,
                CourtName = s.CourtName,
                Status = s.Status.ToString()
            })).OrderByDescending(s => s.ScheduledAt).ToList(),
            Invoices = cases.SelectMany(c => c.Invoices.Select(i => new ClientInvoiceSummaryDto
            {
                Id = i.Id,
                CaseId = c.Id,
                CaseNumber = c.CaseNumber,
                InvoiceNumber = i.InvoiceNumber,
                Title = i.Title,
                Amount = i.Amount,
                PaidAmount = i.Payments.Sum(p => p.Amount),
                DueDate = i.DueDate,
                Status = i.Status.ToString(),
                Payments = i.Payments.Select(p => new ClientPaymentSummaryDto
                {
                    Id = p.Id,
                    Amount = p.Amount,
                    PaymentDate = p.PaymentDate,
                    Method = p.Method.ToString(),
                    Notes = p.Notes
                }).OrderByDescending(p => p.PaymentDate).ToList()
            })).OrderByDescending(i => i.DueDate).ToList(),
            Documents = cases.SelectMany(c => c.Documents.Select(d => new ClientDocumentSummaryDto
            {
                Id = d.Id,
                CaseId = c.Id,
                CaseNumber = c.CaseNumber,
                OriginalFileName = d.OriginalFileName,
                Category = d.Category.ToString(),
                FileSize = d.FileSize,
                CreatedAt = d.CreatedAt
            })).OrderByDescending(d => d.CreatedAt).ToList()
        };

        return worksDto;
    }

    public async Task<ClientDto> CreateClientAsync(CreateClientDto clientDto)
    {
        if (!string.IsNullOrEmpty(clientDto.NationalId))
        {
            var existing = await _clientRepository.FindAsync(c => c.NationalId == clientDto.NationalId);
            if (existing.Any())
            {
                throw new InvalidOperationException("NATIONAL_ID_EXISTS");
            }
        }

        var client = new Client
        {
            FullName = clientDto.FullName,
            Phone = clientDto.Phone,
            Email = clientDto.Email,
            Address = clientDto.Address,
            NationalId = clientDto.NationalId
        };

        await _clientRepository.AddAsync(client);
        await _unitOfWork.CompleteAsync();

        await _auditService.LogAsync("ClientCreated", "Client", client.Id.ToString(), null, $"{{\"name\": \"{client.FullName}\"}}");

        return MapToDto(client);
    }

    public async Task UpdateClientAsync(Guid id, UpdateClientDto clientDto)
    {
        var client = await _clientRepository.GetByIdAsync(id);
        if (client == null) throw new KeyNotFoundException($"Client with Id {id} not found.");

        if (!string.IsNullOrEmpty(clientDto.NationalId))
        {
            var existing = await _clientRepository.FindAsync(c => c.NationalId == clientDto.NationalId && c.Id != id);
            if (existing.Any())
            {
                throw new InvalidOperationException("NATIONAL_ID_EXISTS");
            }
        }

        client.FullName = clientDto.FullName;
        client.Phone = clientDto.Phone;
        client.Email = clientDto.Email;
        client.Address = clientDto.Address;
        client.NationalId = clientDto.NationalId;
        client.UpdatedAt = DateTime.UtcNow;

        _clientRepository.Update(client);
        await _unitOfWork.CompleteAsync();

        await _auditService.LogAsync("ClientUpdated", "Client", client.Id.ToString());
    }

    public async Task DeleteClientAsync(Guid id)
    {
        var client = await _clientRepository.GetByIdAsync(id);
        if (client == null) throw new KeyNotFoundException($"Client with Id {id} not found.");

        _clientRepository.Delete(client);
        await _unitOfWork.CompleteAsync();

        await _auditService.LogAsync("ClientDeleted", "Client", id.ToString(), null, $"{{\"name\": \"{client.FullName}\"}}");
    }

    private static ClientDto MapToDto(Client client)
    {
        return new ClientDto
        {
            Id = client.Id,
            FullName = client.FullName,
            Phone = client.Phone,
            Email = client.Email,
            Address = client.Address,
            NationalId = client.NationalId
        };
    }
}
