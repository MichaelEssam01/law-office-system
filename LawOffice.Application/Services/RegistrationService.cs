using LawOffice.Application.DTOs.Registrations;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Application.Services;

public class RegistrationService : IRegistrationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditService _auditService;

    public RegistrationService(IUnitOfWork unitOfWork, IAuditService auditService)
    {
        _unitOfWork = unitOfWork;
        _auditService = auditService;
    }

    public async Task<IEnumerable<RegistrationListDto>> GetAllAsync(Guid? clientId = null, Guid? lawyerId = null)
    {
        var query = _unitOfWork.Repository<Registration>().Query()
            .Include(r => r.Client)
            .Include(r => r.AssignedLawyer)
            .Include(r => r.Procedures)
            .AsNoTracking();

        if (clientId.HasValue)
        {
            query = query.Where(r => r.ClientId == clientId.Value);
        }

        if (lawyerId.HasValue)
        {
            query = query.Where(r => r.AssignedLawyerId == lawyerId.Value);
        }

        var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();

        return list.Select(r => new RegistrationListDto
        {
            Id = r.Id,
            RegistrationNumber = r.RegistrationNumber,
            AuthorityName = r.AuthorityName,
            RequestType = r.RequestType,
            OtherRequestType = r.OtherRequestType,
            FileNumber = r.FileNumber,
            FileYear = r.FileYear,
            FileColor = r.FileColor,
            ResultNumber = r.ResultNumber,
            ResultDate = r.ResultDate,
            ResultAuthority = r.ResultAuthority,
            ClientId = r.ClientId,
            ClientName = r.Client.FullName,
            ClientNumber = r.Client.ClientNumber,
            AssignedLawyerId = r.AssignedLawyerId,
            LawyerName = r.AssignedLawyer != null ? r.AssignedLawyer.FullName : string.Empty,
            ActiveProcedures = r.Procedures.Select(p => p.ProcedureType).ToList(),
            CreatedAt = r.CreatedAt
        });
    }

    public async Task<RegistrationDetailDto?> GetByIdAsync(Guid id)
    {
        var item = await _unitOfWork.Repository<Registration>().Query()
            .Include(r => r.Client)
            .Include(r => r.AssignedLawyer)
            .Include(r => r.Procedures)
                .ThenInclude(p => p.ResponsibleLawyer)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (item == null) return null;

        return new RegistrationDetailDto
        {
            Id = item.Id,
            RegistrationNumber = item.RegistrationNumber,
            AuthorityName = item.AuthorityName,
            RequestType = item.RequestType,
            OtherRequestType = item.OtherRequestType,
            FileNumber = item.FileNumber,
            FileYear = item.FileYear,
            FileColor = item.FileColor,
            ResultNumber = item.ResultNumber,
            ResultDate = item.ResultDate,
            ResultAuthority = item.ResultAuthority,
            Notes = item.Notes,
            ClientId = item.ClientId,
            ClientName = item.Client.FullName,
            ClientNumber = item.Client.ClientNumber,
            AssignedLawyerId = item.AssignedLawyerId,
            LawyerName = item.AssignedLawyer != null ? item.AssignedLawyer.FullName : string.Empty,
            ActiveProcedures = item.Procedures.Select(p => p.ProcedureType).ToList(),
            Procedures = item.Procedures.OrderBy(p => p.ProcedureType).Select(p => new RegistrationProcedureDto
            {
                Id = p.Id,
                ProcedureType = p.ProcedureType,
                StartDate = p.StartDate,
                CompletedWork = p.CompletedWork,
                Obstacles = p.Obstacles,
                RequiredAction = p.RequiredAction,
                ResponsibleLawyerId = p.ResponsibleLawyerId,
                ResponsibleLawyerName = p.ResponsibleLawyer?.FullName,
                Notes = p.Notes
            }).ToList(),
            CreatedAt = item.CreatedAt,
            CreatedBy = item.CreatedBy,
            UpdatedAt = item.UpdatedAt
        };
    }

    public async Task<RegistrationDetailDto> CreateAsync(CreateRegistrationDto dto, Guid userId)
    {
        string regNumber = dto.RegistrationNumber ?? string.Empty;
        if (string.IsNullOrWhiteSpace(regNumber))
        {
            var year = DateTime.UtcNow.Year;
            var totalCount = await _unitOfWork.Repository<Registration>().Query()
                .CountAsync(r => r.CreatedAt.Year == year);
            regNumber = $"REG-{year}-{(totalCount + 1):D4}";
            while (await _unitOfWork.Repository<Registration>().Query().AnyAsync(r => r.RegistrationNumber == regNumber))
            {
                totalCount++;
                regNumber = $"REG-{year}-{(totalCount + 1):D4}";
            }
        }

        var entity = new Registration
        {
            RegistrationNumber = regNumber,
            AuthorityName = dto.AuthorityName,
            RequestType = dto.RequestType,
            OtherRequestType = dto.OtherRequestType,
            FileNumber = dto.FileNumber,
            FileYear = dto.FileYear,
            FileColor = dto.FileColor,
            ResultNumber = dto.ResultNumber,
            ResultDate = dto.ResultDate,
            ResultAuthority = dto.ResultAuthority,
            Notes = dto.Notes,
            ClientId = dto.ClientId,
            AssignedLawyerId = dto.AssignedLawyerId,
            CreatedBy = userId
        };

        if (dto.Procedures != null && dto.Procedures.Any())
        {
            foreach (var p in dto.Procedures)
            {
                entity.Procedures.Add(new RegistrationProcedure
                {
                    ProcedureType = p.ProcedureType,
                    StartDate = p.StartDate,
                    CompletedWork = p.CompletedWork,
                    Obstacles = p.Obstacles,
                    RequiredAction = p.RequiredAction,
                    ResponsibleLawyerId = p.ResponsibleLawyerId,
                    Notes = p.Notes
                });
            }
        }

        await _unitOfWork.Repository<Registration>().AddAsync(entity);
        await _unitOfWork.CompleteAsync();
        await _auditService.LogAsync("RegistrationCreated", "Registration", entity.Id.ToString(), userId, $"{{\"number\": \"{entity.RegistrationNumber}\", \"authority\": \"{entity.AuthorityName}\"}}");

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<bool> UpdateAsync(UpdateRegistrationDto dto, Guid userId)
    {
        var entity = await _unitOfWork.Repository<Registration>().Query()
            .Include(r => r.Procedures)
            .FirstOrDefaultAsync(r => r.Id == dto.Id);

        if (entity == null) return false;

        entity.AuthorityName = dto.AuthorityName;
        entity.RequestType = dto.RequestType;
        entity.OtherRequestType = dto.OtherRequestType;
        entity.FileNumber = dto.FileNumber;
        entity.FileYear = dto.FileYear;
        entity.FileColor = dto.FileColor;
        entity.ResultNumber = dto.ResultNumber;
        entity.ResultDate = dto.ResultDate;
        entity.ResultAuthority = dto.ResultAuthority;
        entity.Notes = dto.Notes;
        entity.ClientId = dto.ClientId;
        entity.AssignedLawyerId = dto.AssignedLawyerId;
        entity.UpdatedAt = DateTime.UtcNow;

        var procRepo = _unitOfWork.Repository<RegistrationProcedure>();
        foreach (var existing in entity.Procedures.ToList())
        {
            procRepo.Delete(existing);
        }
        entity.Procedures.Clear();

        if (dto.Procedures != null)
        {
            foreach (var p in dto.Procedures)
            {
                entity.Procedures.Add(new RegistrationProcedure
                {
                    RegistrationId = entity.Id,
                    ProcedureType = p.ProcedureType,
                    StartDate = p.StartDate,
                    CompletedWork = p.CompletedWork,
                    Obstacles = p.Obstacles,
                    RequiredAction = p.RequiredAction,
                    ResponsibleLawyerId = p.ResponsibleLawyerId,
                    Notes = p.Notes
                });
            }
        }

        _unitOfWork.Repository<Registration>().Update(entity);
        await _unitOfWork.CompleteAsync();
        await _auditService.LogAsync("RegistrationUpdated", "Registration", entity.Id.ToString(), userId, $"{{\"number\": \"{entity.RegistrationNumber}\", \"authority\": \"{entity.AuthorityName}\"}}");
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _unitOfWork.Repository<Registration>().GetByIdAsync(id);
        if (entity == null) return false;
        _unitOfWork.Repository<Registration>().Delete(entity);
        await _unitOfWork.CompleteAsync();
        await _auditService.LogAsync("Registration", "Delete", id.ToString());
        return true;
    }
}
