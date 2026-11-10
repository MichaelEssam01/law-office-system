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
            .Include(c => c.Parties)
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
            Subject = c.Subject,
            Status = c.Status,
            ArchivingType = c.ArchivingType,
            CaseType = c.CaseType,
            FamilyCaseSubtype = c.FamilyCaseSubtype,
            LitigationDegree = c.LitigationDegree,
            CourtCaseNumber = c.CourtCaseNumber,
            YearType = c.YearType,
            Year = c.Year,
            FileNumber = c.FileNumber,
            FileYear = c.FileYear,
            FileColor = c.FileColor,
            HasOfficeAction = c.HasOfficeAction,
            HasCourtAction = c.HasCourtAction,
            HasExternalAction = c.HasExternalAction,
            HasOtherAction = c.HasOtherAction,
            SuspensionReason = c.SuspensionReason,
            ClientName = c.Client.FullName,
            ClientNumber = c.Client.ClientNumber,
            OpponentName = c.Parties?.FirstOrDefault(p => p.PartyType == PartyType.Opponent)?.Name,
            LawyerName = c.AssignedLawyer != null ? c.AssignedLawyer.FullName : string.Empty,
            ClientId = c.ClientId,
            StartDate = c.StartDate,
            ClosedDate = c.ClosedDate,
            CreatedAt = c.CreatedAt
        });
    }

    public async Task<CaseDetailDto?> GetByIdAsync(Guid id)
    {
        var @case = await _unitOfWork.Repository<Case>().Query()
            .Include(c => c.Client)
            .Include(c => c.AssignedLawyer)
            .Include(c => c.Parties)
                .ThenInclude(p => p.Client)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (@case == null) return null;

        return new CaseDetailDto
        {
            Id = @case.Id,
            CaseNumber = @case.CaseNumber,
            Title = @case.Title,
            Subject = @case.Subject,
            Description = @case.Description,
            Status = @case.Status,
            ArchivingType = @case.ArchivingType,
            AgreementDate = @case.AgreementDate,
            StartDate = @case.StartDate,
            CourtFilingDate = @case.CourtFilingDate,
            ClosedDate = @case.ClosedDate,
            CaseType = @case.CaseType,
            FamilyCaseSubtype = @case.FamilyCaseSubtype,
            CourtCaseNumber = @case.CourtCaseNumber,
            YearType = @case.YearType,
            Year = @case.Year,
            LitigationDegree = @case.LitigationDegree,
            FileNumber = @case.FileNumber,
            FileYear = @case.FileYear,
            FileColor = @case.FileColor,
            JudgmentResult = @case.JudgmentResult,
            JudgmentDate = @case.JudgmentDate,
            Notes = @case.Notes,
            OfficeAction = @case.OfficeAction,
            CourtAction = @case.CourtAction,
            ExternalAction = @case.ExternalAction,
            OtherAction = @case.OtherAction,
            HasOfficeAction = @case.HasOfficeAction,
            HasCourtAction = @case.HasCourtAction,
            HasExternalAction = @case.HasExternalAction,
            HasOtherAction = @case.HasOtherAction,
            SuspensionReason = @case.SuspensionReason,
            SuspensionDocumentsText = @case.SuspensionDocumentsText,
            SuspensionOtherText = @case.SuspensionOtherText,
            ClientId = @case.ClientId,
            ClientName = @case.Client.FullName,
            AssignedLawyerId = @case.AssignedLawyerId,
            LawyerName = @case.AssignedLawyer != null ? @case.AssignedLawyer.FullName : string.Empty,
            Parties = @case.Parties.Select(p => new CasePartyDto
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
            var exists = await _unitOfWork.Repository<Case>().Query().AnyAsync(c => c.CaseNumber == caseNumber);
            if (exists) throw new Exception("Case number already exists");
        }

        var @case = new Case
        {
            CaseNumber = caseNumber,
            Title = dto.Title,
            Subject = dto.Subject ?? dto.Description ?? dto.Title,
            Description = dto.Description ?? string.Empty,
            Status = dto.Status,
            ArchivingType = dto.Status == CaseStatus.Finished ? dto.ArchivingType : null,
            AgreementDate = dto.AgreementDate,
            StartDate = dto.StartDate,
            CourtFilingDate = dto.CourtFilingDate,
            CaseType = dto.CaseType,
            FamilyCaseSubtype = dto.CaseType == CaseType.Family ? dto.FamilyCaseSubtype : null,
            CourtCaseNumber = dto.CourtCaseNumber,
            YearType = dto.YearType,
            Year = dto.Year,
            LitigationDegree = dto.LitigationDegree,
            FileNumber = dto.FileNumber,
            FileYear = dto.FileYear,
            FileColor = dto.FileColor,
            JudgmentResult = dto.JudgmentResult,
            JudgmentDate = dto.JudgmentDate,
            Notes = dto.Notes,
            OfficeAction = dto.OfficeAction,
            CourtAction = dto.CourtAction,
            ExternalAction = dto.ExternalAction,
            OtherAction = dto.OtherAction,
            HasOfficeAction = dto.HasOfficeAction,
            HasCourtAction = dto.HasCourtAction,
            HasExternalAction = dto.HasExternalAction,
            HasOtherAction = dto.HasOtherAction,
            SuspensionReason = dto.SuspensionReason,
            SuspensionDocumentsText = dto.SuspensionDocumentsText,
            SuspensionOtherText = dto.SuspensionOtherText,
            ClientId = dto.ClientId,
            AssignedLawyerId = dto.AssignedLawyerId,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        if (dto.Parties != null && dto.Parties.Any())
        {
            foreach (var p in dto.Parties)
            {
                @case.Parties.Add(new CaseParty
                {
                    PartyType = p.PartyType,
                    ClientId = p.ClientId,
                    Name = p.Name,
                    Capacity = p.Capacity,
                    DisputeNature = p.DisputeNature,
                    HasSameCapacityOthers = p.PartyType == PartyType.Client && p.HasSameCapacityOthers,
                    OtherPersonName = p.PartyType == PartyType.Client && p.HasSameCapacityOthers ? p.OtherPersonName : null,
                    OtherLawyerName = p.PartyType == PartyType.Client && p.HasSameCapacityOthers ? p.OtherLawyerName : null,
                    OpponentLawyerName = p.PartyType == PartyType.Opponent ? p.OpponentLawyerName : null
                });
            }
        }

        await _unitOfWork.Repository<Case>().AddAsync(@case);
        await _unitOfWork.CompleteAsync();

        await _auditService.LogAsync("CaseCreated", "Case", @case.Id.ToString(), userId, $"{{\"number\": \"{@case.CaseNumber}\", \"title\": \"{@case.Title}\"}}");

        await _notificationService.NotifyUserAndAdminsAsync(
            @case.AssignedLawyerId,
            "NOTIFICATIONS.CASE_ASSIGNED_TITLE",
            "NOTIFICATIONS.CASE_ASSIGNED_MSG",
            "Cases",
            $"/cases/{@case.Id}",
            new Dictionary<string, string> { { "number", @case.CaseNumber }, { "title", @case.Title } });

        return (await GetByIdAsync(@case.Id))!;
    }

    public async Task<bool> UpdateAsync(UpdateCaseDto dto, Guid userId)
    {
        var @case = await _unitOfWork.Repository<Case>().Query()
            .Include(c => c.Parties)
            .FirstOrDefaultAsync(c => c.Id == dto.Id);

        if (@case == null) return false;

        if (!string.IsNullOrWhiteSpace(dto.CaseNumber))
        {
            @case.CaseNumber = dto.CaseNumber;
        }
        @case.Title = dto.Title;
        @case.Subject = dto.Subject ?? dto.Description ?? dto.Title;
        @case.Description = dto.Description ?? string.Empty;
        @case.Status = dto.Status;
        @case.ArchivingType = dto.Status == CaseStatus.Finished ? dto.ArchivingType : null;
        @case.AgreementDate = dto.AgreementDate;
        @case.StartDate = dto.StartDate;
        @case.CourtFilingDate = dto.CourtFilingDate;
        @case.ClosedDate = dto.ClosedDate;
        @case.CaseType = dto.CaseType;
        @case.FamilyCaseSubtype = dto.CaseType == CaseType.Family ? dto.FamilyCaseSubtype : null;
        @case.CourtCaseNumber = dto.CourtCaseNumber;
        @case.YearType = dto.YearType;
        @case.Year = dto.Year;
        @case.LitigationDegree = dto.LitigationDegree;
        @case.FileNumber = dto.FileNumber;
        @case.FileYear = dto.FileYear;
        @case.FileColor = dto.FileColor;
        @case.JudgmentResult = dto.JudgmentResult;
        @case.JudgmentDate = dto.JudgmentDate;
        @case.Notes = dto.Notes;
        @case.OfficeAction = dto.OfficeAction;
        @case.CourtAction = dto.CourtAction;
        @case.ExternalAction = dto.ExternalAction;
        @case.OtherAction = dto.OtherAction;
        @case.HasOfficeAction = dto.HasOfficeAction;
        @case.HasCourtAction = dto.HasCourtAction;
        @case.HasExternalAction = dto.HasExternalAction;
        @case.HasOtherAction = dto.HasOtherAction;
        @case.SuspensionReason = dto.SuspensionReason;
        @case.SuspensionDocumentsText = dto.SuspensionDocumentsText;
        @case.SuspensionOtherText = dto.SuspensionOtherText;
        @case.ClientId = dto.ClientId;
        @case.AssignedLawyerId = dto.AssignedLawyerId;
        @case.UpdatedAt = DateTime.UtcNow;

        // Sync Parties
        @case.Parties.Clear();
        if (dto.Parties != null && dto.Parties.Any())
        {
            foreach (var p in dto.Parties)
            {
                @case.Parties.Add(new CaseParty
                {
                    CaseId = @case.Id,
                    PartyType = p.PartyType,
                    ClientId = p.ClientId,
                    Name = p.Name,
                    Capacity = p.Capacity,
                    DisputeNature = p.DisputeNature,
                    HasSameCapacityOthers = p.PartyType == PartyType.Client && p.HasSameCapacityOthers,
                    OtherPersonName = p.PartyType == PartyType.Client && p.HasSameCapacityOthers ? p.OtherPersonName : null,
                    OtherLawyerName = p.PartyType == PartyType.Client && p.HasSameCapacityOthers ? p.OtherLawyerName : null,
                    OpponentLawyerName = p.PartyType == PartyType.Opponent ? p.OpponentLawyerName : null
                });
            }
        }

        _unitOfWork.Repository<Case>().Update(@case);
        await _unitOfWork.CompleteAsync();

        await _auditService.LogAsync("CaseUpdated", "Case", @case.Id.ToString(), userId, $"{{\"status\": \"{@case.Status}\"}}");

        await _notificationService.NotifyUserAndAdminsAsync(
            @case.AssignedLawyerId,
            "NOTIFICATIONS.CASE_UPDATED_TITLE",
            "NOTIFICATIONS.CASE_UPDATED_MSG",
            "Cases",
            $"/cases/{@case.Id}",
            new Dictionary<string, string> { { "number", @case.CaseNumber } });
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
