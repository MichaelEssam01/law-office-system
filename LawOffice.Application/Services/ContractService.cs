using LawOffice.Application.DTOs.Contracts;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using LawOffice.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Application.Services;

public class ContractService : IContractService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditService _auditService;
    private readonly INotificationService _notificationService;

    public ContractService(IUnitOfWork unitOfWork, IAuditService auditService, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _auditService = auditService;
        _notificationService = notificationService;
    }

    public async Task<IEnumerable<ContractListDto>> GetAllAsync(string? status = null, Guid? clientId = null, Guid? lawyerId = null)
    {
        var query = _unitOfWork.Repository<Contract>().Query()
            .Include(c => c.Client)
            .Include(c => c.AssignedLawyer)
            .Include(c => c.Parties)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ContractStatus>(status, true, out var statusEnum))
        {
            query = query.Where(c => c.Status == statusEnum);
        }

        if (clientId.HasValue)
        {
            query = query.Where(c => c.ClientId == clientId.Value);
        }

        if (lawyerId.HasValue)
        {
            query = query.Where(c => c.AssignedLawyerId == lawyerId.Value);
        }

        var list = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();

        return list.Select(c => new ContractListDto
        {
            Id = c.Id,
            ContractNumber = c.ContractNumber,
            Title = c.Title,
            Status = c.Status,
            ContractType = c.ContractType,
            OtherContractType = c.OtherContractType,
            FileNumber = c.FileNumber,
            FileYear = c.FileYear,
            FileColor = c.FileColor,
            ClientId = c.ClientId,
            ClientName = c.Client.FullName,
            ClientNumber = c.Client.ClientNumber,
            OtherPartyName = c.Parties?.FirstOrDefault(p => p.PartyType == PartyType.Opponent)?.Name,
            AssignedLawyerId = c.AssignedLawyerId,
            LawyerName = c.AssignedLawyer != null ? c.AssignedLawyer.FullName : string.Empty,
            AgreementDate = c.AgreementDate,
            StartDate = c.StartDate,
            ClosedDate = c.ClosedDate,
            CreatedAt = c.CreatedAt
        });
    }

    public async Task<ContractDetailDto?> GetByIdAsync(Guid id)
    {
        var item = await _unitOfWork.Repository<Contract>().Query()
            .Include(c => c.Client)
            .Include(c => c.AssignedLawyer)
            .Include(c => c.Parties)
                .ThenInclude(p => p.Client)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (item == null) return null;

        return new ContractDetailDto
        {
            Id = item.Id,
            ContractNumber = item.ContractNumber,
            Title = item.Title,
            Status = item.Status,
            ContractType = item.ContractType,
            OtherContractType = item.OtherContractType,
            FileNumber = item.FileNumber,
            FileYear = item.FileYear,
            FileColor = item.FileColor,
            Notes = item.Notes,
            ClientId = item.ClientId,
            ClientName = item.Client.FullName,
            ClientNumber = item.Client.ClientNumber,
            OtherPartyName = item.Parties?.FirstOrDefault(p => p.PartyType == PartyType.Opponent)?.Name,
            AssignedLawyerId = item.AssignedLawyerId,
            LawyerName = item.AssignedLawyer != null ? item.AssignedLawyer.FullName : string.Empty,
            AgreementDate = item.AgreementDate,
            StartDate = item.StartDate,
            ClosedDate = item.ClosedDate,
            Parties = (item.Parties ?? new List<ContractParty>()).Select(p => new ContractPartyDto
            {
                Id = p.Id,
                PartyType = p.PartyType,
                ClientId = p.ClientId,
                Name = p.Client != null ? p.Client.FullName : p.Name,
                Capacity = p.Capacity,
                HasSameCapacityOthers = p.HasSameCapacityOthers,
                OtherPersonName = p.OtherPersonName,
                OtherLawyerName = p.OtherLawyerName,
                OpponentLawyerName = p.OpponentLawyerName
            }).ToList(),
            CreatedAt = item.CreatedAt,
            CreatedBy = item.CreatedBy,
            UpdatedAt = item.UpdatedAt
        };
    }

    public async Task<ContractDetailDto> CreateAsync(CreateContractDto dto, Guid userId)
    {
        string contractNumber = dto.ContractNumber ?? string.Empty;
        if (string.IsNullOrWhiteSpace(contractNumber))
        {
            var year = DateTime.UtcNow.Year;
            var totalCount = await _unitOfWork.Repository<Contract>().Query()
                .CountAsync(c => c.CreatedAt.Year == year);
            contractNumber = $"CNT-{year}-{(totalCount + 1):D4}";
            while (await _unitOfWork.Repository<Contract>().Query().AnyAsync(c => c.ContractNumber == contractNumber))
            {
                totalCount++;
                contractNumber = $"CNT-{year}-{(totalCount + 1):D4}";
            }
        }

        var entity = new Contract
        {
            ContractNumber = contractNumber,
            Title = dto.Title,
            Status = dto.Status,
            AgreementDate = dto.AgreementDate,
            StartDate = dto.StartDate,
            ClosedDate = dto.ClosedDate,
            ContractType = dto.ContractType,
            OtherContractType = dto.OtherContractType,
            FileNumber = dto.FileNumber,
            FileYear = dto.FileYear,
            FileColor = dto.FileColor,
            Notes = dto.Notes,
            ClientId = dto.ClientId,
            AssignedLawyerId = dto.AssignedLawyerId,
            CreatedBy = userId
        };

        if (dto.Parties != null && dto.Parties.Any())
        {
            foreach (var p in dto.Parties)
            {
                entity.Parties.Add(new ContractParty
                {
                    PartyType = p.PartyType,
                    ClientId = p.ClientId,
                    Name = p.Name,
                    Capacity = p.Capacity,
                    HasSameCapacityOthers = p.HasSameCapacityOthers,
                    OtherPersonName = p.OtherPersonName,
                    OtherLawyerName = p.OtherLawyerName,
                    OpponentLawyerName = p.OpponentLawyerName
                });
            }
        }

        await _unitOfWork.Repository<Contract>().AddAsync(entity);
        await _unitOfWork.CompleteAsync();
        await _auditService.LogAsync("ContractCreated", "Contract", entity.Id.ToString(), userId, $"{{\"number\": \"{entity.ContractNumber}\", \"title\": \"{entity.Title}\"}}");

        await _notificationService.NotifyUserAndAdminsAsync(
            entity.AssignedLawyerId,
            "NOTIFICATIONS.CONTRACT_ASSIGNED_TITLE",
            "NOTIFICATIONS.CONTRACT_ASSIGNED_MSG",
            "Cases",
            "/contracts",
            new Dictionary<string, string> { { "number", entity.ContractNumber }, { "title", entity.Title } });

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<bool> UpdateAsync(UpdateContractDto dto, Guid userId)
    {
        var entity = await _unitOfWork.Repository<Contract>().Query()
            .Include(c => c.Parties)
            .FirstOrDefaultAsync(c => c.Id == dto.Id);

        if (entity == null) return false;

        entity.Title = dto.Title;
        entity.Status = dto.Status;
        entity.AgreementDate = dto.AgreementDate;
        entity.StartDate = dto.StartDate;
        entity.ClosedDate = dto.ClosedDate;
        entity.ContractType = dto.ContractType;
        entity.OtherContractType = dto.OtherContractType;
        entity.FileNumber = dto.FileNumber;
        entity.FileYear = dto.FileYear;
        entity.FileColor = dto.FileColor;
        entity.Notes = dto.Notes;
        entity.ClientId = dto.ClientId;
        entity.AssignedLawyerId = dto.AssignedLawyerId;
        entity.UpdatedAt = DateTime.UtcNow;

        var partyRepo = _unitOfWork.Repository<ContractParty>();
        foreach (var existing in entity.Parties.ToList())
        {
            partyRepo.Delete(existing);
        }
        entity.Parties.Clear();

        if (dto.Parties != null)
        {
            foreach (var p in dto.Parties)
            {
                entity.Parties.Add(new ContractParty
                {
                    ContractId = entity.Id,
                    PartyType = p.PartyType,
                    ClientId = p.ClientId,
                    Name = p.Name,
                    Capacity = p.Capacity,
                    HasSameCapacityOthers = p.HasSameCapacityOthers,
                    OtherPersonName = p.OtherPersonName,
                    OtherLawyerName = p.OtherLawyerName,
                    OpponentLawyerName = p.OpponentLawyerName
                });
            }
        }

        _unitOfWork.Repository<Contract>().Update(entity);
        await _unitOfWork.CompleteAsync();
        await _auditService.LogAsync("ContractUpdated", "Contract", entity.Id.ToString(), userId, $"{{\"number\": \"{entity.ContractNumber}\", \"title\": \"{entity.Title}\"}}");
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _unitOfWork.Repository<Contract>().GetByIdAsync(id);
        if (entity == null) return false;
        _unitOfWork.Repository<Contract>().Delete(entity);
        await _unitOfWork.CompleteAsync();
        await _auditService.LogAsync("Contract", "Delete", id.ToString());
        return true;
    }
}
