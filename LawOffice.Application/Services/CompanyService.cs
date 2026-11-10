using LawOffice.Application.DTOs.Companies;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using LawOffice.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Application.Services;

public class CompanyService : ICompanyService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditService _auditService;
    private readonly INotificationService _notificationService;

    public CompanyService(IUnitOfWork unitOfWork, IAuditService auditService, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _auditService = auditService;
        _notificationService = notificationService;
    }

    public async Task<IEnumerable<CompanyListDto>> GetAllAsync(string? status = null, Guid? clientId = null, Guid? lawyerId = null)
    {
        var query = _unitOfWork.Repository<Company>().Query()
            .Include(c => c.Client)
            .Include(c => c.AssignedLawyer)
            .Include(c => c.Parties)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<CompanyStatus>(status, true, out var statusEnum))
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

        return list.Select(c => new CompanyListDto
        {
            Id = c.Id,
            CompanyCode = c.CompanyCode,
            Title = c.Title,
            Status = c.Status,
            CompanyType = c.CompanyType,
            OtherCompanyType = c.OtherCompanyType,
            CompanyNumber = c.CompanyNumber,
            CompanyDuration = c.CompanyDuration,
            AuthorityDetails = c.AuthorityDetails,
            FileNumber = c.FileNumber,
            FileYear = c.FileYear,
            FileColor = c.FileColor,
            TaxNumber = c.TaxNumber,
            Result = c.Result,
            ClientId = c.ClientId,
            ClientName = c.Client.FullName,
            ClientNumber = c.Client.ClientNumber,
            OpponentName = c.Parties?.FirstOrDefault(p => p.PartyType == PartyType.Opponent)?.Name,
            AssignedLawyerId = c.AssignedLawyerId,
            LawyerName = c.AssignedLawyer != null ? c.AssignedLawyer.FullName : string.Empty,
            AgreementDate = c.AgreementDate,
            StartDate = c.StartDate,
            FilingDate = c.FilingDate,
            ClosedDate = c.ClosedDate,
            CreatedAt = c.CreatedAt
        });
    }

    public async Task<CompanyDetailDto?> GetByIdAsync(Guid id)
    {
        var item = await _unitOfWork.Repository<Company>().Query()
            .Include(c => c.Client)
            .Include(c => c.AssignedLawyer)
            .Include(c => c.Parties)
                .ThenInclude(p => p.Client)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (item == null) return null;

        return new CompanyDetailDto
        {
            Id = item.Id,
            CompanyCode = item.CompanyCode,
            Title = item.Title,
            Status = item.Status,
            CompanyType = item.CompanyType,
            OtherCompanyType = item.OtherCompanyType,
            CompanyNumber = item.CompanyNumber,
            CompanyDuration = item.CompanyDuration,
            AuthorityDetails = item.AuthorityDetails,
            FileNumber = item.FileNumber,
            FileYear = item.FileYear,
            FileColor = item.FileColor,
            ContractProcedure = item.ContractProcedure,
            RegistryProcedure = item.RegistryProcedure,
            RegistrationPlace = item.RegistrationPlace,
            SubsequentProcedures = item.SubsequentProcedures,
            TaxNumber = item.TaxNumber,
            ValueAddedTax = item.ValueAddedTax,
            Result = item.Result,
            Notes = item.Notes,
            ClientId = item.ClientId,
            ClientName = item.Client.FullName,
            ClientNumber = item.Client.ClientNumber,
            OpponentName = item.Parties?.FirstOrDefault(p => p.PartyType == PartyType.Opponent)?.Name,
            AssignedLawyerId = item.AssignedLawyerId,
            LawyerName = item.AssignedLawyer != null ? item.AssignedLawyer.FullName : string.Empty,
            AgreementDate = item.AgreementDate,
            StartDate = item.StartDate,
            FilingDate = item.FilingDate,
            ClosedDate = item.ClosedDate,
            Parties = (item.Parties ?? new List<CompanyParty>()).Select(p => new CompanyPartyDto
            {
                Id = p.Id,
                PartyType = p.PartyType,
                ClientId = p.ClientId,
                Name = p.Client != null ? p.Client.FullName : p.Name,
                Capacity = p.Capacity,
                DisputeNature = p.DisputeNature,
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

    public async Task<CompanyDetailDto> CreateAsync(CreateCompanyDto dto, Guid userId)
    {
        string code = dto.CompanyCode ?? string.Empty;
        if (string.IsNullOrWhiteSpace(code))
        {
            var year = DateTime.UtcNow.Year;
            var totalCount = await _unitOfWork.Repository<Company>().Query()
                .CountAsync(c => c.CreatedAt.Year == year);
            code = $"CMP-{year}-{(totalCount + 1):D4}";
            while (await _unitOfWork.Repository<Company>().Query().AnyAsync(c => c.CompanyCode == code))
            {
                totalCount++;
                code = $"CMP-{year}-{(totalCount + 1):D4}";
            }
        }

        var entity = new Company
        {
            CompanyCode = code,
            Title = dto.Title,
            Status = dto.Status,
            AgreementDate = dto.AgreementDate,
            StartDate = dto.StartDate,
            FilingDate = dto.FilingDate,
            ClosedDate = dto.ClosedDate,
            CompanyType = dto.CompanyType,
            OtherCompanyType = dto.OtherCompanyType,
            CompanyNumber = dto.CompanyNumber,
            CompanyDuration = dto.CompanyDuration,
            AuthorityDetails = dto.AuthorityDetails,
            FileNumber = dto.FileNumber,
            FileYear = dto.FileYear,
            FileColor = dto.FileColor,
            ContractProcedure = dto.ContractProcedure,
            RegistryProcedure = dto.RegistryProcedure,
            RegistrationPlace = dto.RegistrationPlace,
            SubsequentProcedures = dto.SubsequentProcedures,
            TaxNumber = dto.TaxNumber,
            ValueAddedTax = dto.ValueAddedTax,
            Result = dto.Result,
            Notes = dto.Notes,
            ClientId = dto.ClientId,
            AssignedLawyerId = dto.AssignedLawyerId,
            CreatedBy = userId
        };

        if (dto.Parties != null && dto.Parties.Any())
        {
            foreach (var p in dto.Parties)
            {
                entity.Parties.Add(new CompanyParty
                {
                    PartyType = p.PartyType,
                    ClientId = p.ClientId,
                    Name = p.Name,
                    Capacity = p.Capacity,
                    DisputeNature = p.DisputeNature,
                    HasSameCapacityOthers = p.HasSameCapacityOthers,
                    OtherPersonName = p.OtherPersonName,
                    OtherLawyerName = p.OtherLawyerName,
                    OpponentLawyerName = p.OpponentLawyerName
                });
            }
        }

        await _unitOfWork.Repository<Company>().AddAsync(entity);
        await _unitOfWork.CompleteAsync();
        await _auditService.LogAsync("CompanyCreated", "Company", entity.Id.ToString(), userId, $"{{\"code\": \"{entity.CompanyCode}\", \"title\": \"{entity.Title}\"}}");

        await _notificationService.NotifyUserAndAdminsAsync(
            entity.AssignedLawyerId,
            "NOTIFICATIONS.COMPANY_ASSIGNED_TITLE",
            "NOTIFICATIONS.COMPANY_ASSIGNED_MSG",
            "Cases",
            "/companies",
            new Dictionary<string, string> { { "number", entity.CompanyCode }, { "title", entity.Title } });

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<bool> UpdateAsync(UpdateCompanyDto dto, Guid userId)
    {
        var entity = await _unitOfWork.Repository<Company>().Query()
            .Include(c => c.Parties)
            .FirstOrDefaultAsync(c => c.Id == dto.Id);

        if (entity == null) return false;

        entity.Title = dto.Title;
        entity.Status = dto.Status;
        entity.AgreementDate = dto.AgreementDate;
        entity.StartDate = dto.StartDate;
        entity.FilingDate = dto.FilingDate;
        entity.ClosedDate = dto.ClosedDate;
        entity.CompanyType = dto.CompanyType;
        entity.OtherCompanyType = dto.OtherCompanyType;
        entity.CompanyNumber = dto.CompanyNumber;
        entity.CompanyDuration = dto.CompanyDuration;
        entity.AuthorityDetails = dto.AuthorityDetails;
        entity.FileNumber = dto.FileNumber;
        entity.FileYear = dto.FileYear;
        entity.FileColor = dto.FileColor;
        entity.ContractProcedure = dto.ContractProcedure;
        entity.RegistryProcedure = dto.RegistryProcedure;
        entity.RegistrationPlace = dto.RegistrationPlace;
        entity.SubsequentProcedures = dto.SubsequentProcedures;
        entity.TaxNumber = dto.TaxNumber;
        entity.ValueAddedTax = dto.ValueAddedTax;
        entity.Result = dto.Result;
        entity.Notes = dto.Notes;
        entity.ClientId = dto.ClientId;
        entity.AssignedLawyerId = dto.AssignedLawyerId;
        entity.UpdatedAt = DateTime.UtcNow;

        var partyRepo = _unitOfWork.Repository<CompanyParty>();
        foreach (var existing in entity.Parties.ToList())
        {
            partyRepo.Delete(existing);
        }
        entity.Parties.Clear();

        if (dto.Parties != null)
        {
            foreach (var p in dto.Parties)
            {
                entity.Parties.Add(new CompanyParty
                {
                    CompanyId = entity.Id,
                    PartyType = p.PartyType,
                    ClientId = p.ClientId,
                    Name = p.Name,
                    Capacity = p.Capacity,
                    DisputeNature = p.DisputeNature,
                    HasSameCapacityOthers = p.HasSameCapacityOthers,
                    OtherPersonName = p.OtherPersonName,
                    OtherLawyerName = p.OtherLawyerName,
                    OpponentLawyerName = p.OpponentLawyerName
                });
            }
        }

        _unitOfWork.Repository<Company>().Update(entity);
        await _unitOfWork.CompleteAsync();
        await _auditService.LogAsync("CompanyUpdated", "Company", entity.Id.ToString(), userId, $"{{\"code\": \"{entity.CompanyCode}\", \"title\": \"{entity.Title}\"}}");
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _unitOfWork.Repository<Company>().GetByIdAsync(id);
        if (entity == null) return false;
        _unitOfWork.Repository<Company>().Delete(entity);
        await _unitOfWork.CompleteAsync();
        await _auditService.LogAsync("Company", "Delete", id.ToString());
        return true;
    }
}
