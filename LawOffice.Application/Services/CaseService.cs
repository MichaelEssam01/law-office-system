using LawOffice.Application.DTOs.Cases;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using LawOffice.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Application.Services;

public class CaseService : ICaseService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditService _auditService;
    private readonly INotificationService _notificationService;

    public CaseService(IUnitOfWork unitOfWork, IAuditService auditService, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _auditService = auditService;
        _notificationService = notificationService;
    }

    public async Task<IEnumerable<CaseListDto>> GetAllAsync(string? status = null, Guid? clientId = null, Guid? lawyerId = null)
    {
        var query = _unitOfWork.Repository<Case>().Query()
            .Include(c => c.Client)
            .Include(c => c.AssignedLawyer)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<CaseStatus>(status, true, out var statusEnum))
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

        var cases = await query.ToListAsync();

        return cases.Select(c => new CaseListDto
        {
            Id = c.Id,
            CaseNumber = c.CaseNumber,
            Title = c.Title,
            Status = c.Status,
            ClientName = c.Client.FullName,
            LawyerName = c.AssignedLawyer.FullName,
            ClientId = c.ClientId,
            StartDate = c.StartDate,
            CreatedAt = c.CreatedAt
        });
    }

    public async Task<CaseDetailDto?> GetByIdAsync(Guid id)
    {
        var @case = await _unitOfWork.Repository<Case>().Query()
            .Include(c => c.Client)
            .Include(c => c.AssignedLawyer)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (@case == null) return null;

        return new CaseDetailDto
        {
            Id = @case.Id,
            CaseNumber = @case.CaseNumber,
            Title = @case.Title,
            Description = @case.Description,
            Status = @case.Status,
            StartDate = @case.StartDate,
            ClosedDate = @case.ClosedDate,
            Notes = @case.Notes,
            ClientId = @case.ClientId,
            ClientName = @case.Client.FullName,
            AssignedLawyerId = @case.AssignedLawyerId,
            LawyerName = @case.AssignedLawyer.FullName,
            CreatedAt = @case.CreatedAt,
            CreatedBy = @case.CreatedBy,
            UpdatedAt = @case.UpdatedAt
        };
    }

    public async Task<CaseDetailDto> CreateAsync(CreateCaseDto dto, Guid userId)
    {
        string caseNumber = dto.CaseNumber ?? string.Empty;

        // Auto-generate case number if not provided
        if (string.IsNullOrWhiteSpace(caseNumber))
        {
            var year = DateTime.UtcNow.Year;
            var totalCount = await _unitOfWork.Repository<Case>().Query()
                .CountAsync(c => c.CreatedAt.Year == year);
            
            caseNumber = $"CASE-{year}-{(totalCount + 1):D4}";

            // Safety check for collisions
            while (await _unitOfWork.Repository<Case>().Query().AnyAsync(c => c.CaseNumber == caseNumber))
            {
                totalCount++;
                caseNumber = $"CASE-{year}-{(totalCount + 1):D4}";
            }
        }
        else
        {
            // Validation: Unique CaseNumber if provided manually
            var exists = await _unitOfWork.Repository<Case>().Query().AnyAsync(c => c.CaseNumber == caseNumber);
            if (exists) throw new Exception("Case number already exists");
        }

        var @case = new Case
        {
            CaseNumber = caseNumber,
            Title = dto.Title,
            Description = dto.Description,
            Status = dto.Status,
            StartDate = dto.StartDate,
            Notes = dto.Notes,
            ClientId = dto.ClientId,
            AssignedLawyerId = dto.AssignedLawyerId,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<Case>().AddAsync(@case);
        await _unitOfWork.CompleteAsync();

        await _auditService.LogAsync("CaseCreated", "Case", @case.Id.ToString(), userId, $"{{\"number\": \"{@case.CaseNumber}\", \"title\": \"{@case.Title}\"}}");

        if (@case.AssignedLawyerId != userId)
        {
            await _notificationService.CreateNotificationAsync(@case.AssignedLawyerId, 
                "NOTIFICATIONS.CASE_ASSIGNED_TITLE", 
                "NOTIFICATIONS.CASE_ASSIGNED_MSG", 
                "Cases", 
                $"/cases/{@case.Id}",
                new Dictionary<string, string> { { "number", @case.CaseNumber }, { "title", @case.Title } });
        }

        return (await GetByIdAsync(@case.Id))!;
    }

    public async Task<bool> UpdateAsync(UpdateCaseDto dto, Guid userId)
    {
        var @case = await _unitOfWork.Repository<Case>().GetByIdAsync(dto.Id);
        if (@case == null) return false;

        if (!string.IsNullOrWhiteSpace(dto.CaseNumber))
        {
            @case.CaseNumber = dto.CaseNumber;
        }
        @case.Title = dto.Title;
        @case.Description = dto.Description;
        @case.Status = dto.Status;
        @case.StartDate = dto.StartDate;
        @case.ClosedDate = dto.ClosedDate;
        @case.Notes = dto.Notes;
        @case.ClientId = dto.ClientId;
        @case.AssignedLawyerId = dto.AssignedLawyerId;
        @case.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Repository<Case>().Update(@case);
        await _unitOfWork.CompleteAsync();

        await _auditService.LogAsync("CaseUpdated", "Case", @case.Id.ToString(), userId, $"{{\"status\": \"{@case.Status}\"}}");

        if (@case.AssignedLawyerId != userId)
        {
            await _notificationService.CreateNotificationAsync(@case.AssignedLawyerId, 
                "NOTIFICATIONS.CASE_UPDATED_TITLE", 
                "NOTIFICATIONS.CASE_UPDATED_MSG", 
                "Cases", 
                $"/cases/{@case.Id}",
                new Dictionary<string, string> { { "number", @case.CaseNumber } });
        }
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var @case = await _unitOfWork.Repository<Case>().GetByIdAsync(id);
        if (@case == null) return false;

        _unitOfWork.Repository<Case>().Delete(@case);
        await _unitOfWork.CompleteAsync();

        await _auditService.LogAsync("CaseDeleted", "Case", id.ToString(), null, $"{{\"number\": \"{@case.CaseNumber}\"}}");
        return true;
    }
}
