using LawOffice.Application.DTOs.Sessions;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using LawOffice.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Application.Services;

public class SessionService : ISessionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notificationService;

    public SessionService(IUnitOfWork unitOfWork, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<IEnumerable<SessionListDto>> GetSessionsAsync(Guid? caseId = null, SessionStatus? status = null, DateTime? date = null, Guid? lawyerId = null)
    {
        var query = _unitOfWork.Repository<Session>().Query()
            .AsNoTracking()
            .Include(s => s.Case)
            .Include(s => s.AssignedLawyer)
            .AsQueryable();

        if (caseId.HasValue)
            query = query.Where(s => s.CaseId == caseId.Value);

        if (status.HasValue)
            query = query.Where(s => s.Status == status.Value);

        if (date.HasValue)
            query = query.Where(s => s.ScheduledAt.Date == date.Value.Date);

        if (lawyerId.HasValue)
            query = query.Where(s => s.AssignedLawyerId == lawyerId.Value);

        return await query
            .OrderBy(s => s.ScheduledAt)
            .Select(s => new SessionListDto
            {
                Id = s.Id,
                CaseId = s.CaseId,
                CaseNumber = s.Case != null ? s.Case.CaseNumber : string.Empty,
                CaseTitle = s.Case != null ? s.Case.Title : string.Empty,
                Title = s.Title,
                ScheduledAt = s.ScheduledAt,
                CourtName = s.CourtName,
                Location = s.Location,
                CircuitNumber = s.CircuitNumber,
                Status = s.Status,
                AssignedLawyerId = s.AssignedLawyerId,
                AssignedLawyerName = s.AssignedLawyer != null ? s.AssignedLawyer.FullName : null,
                CurrentSessionRole = s.CurrentSessionRole,
                DecisionKey = s.DecisionKey,
                DecisionText = s.DecisionText
            })
            .ToListAsync();
    }

    public async Task<SessionDetailDto?> GetSessionByIdAsync(Guid id)
    {
        var session = await _unitOfWork.Repository<Session>().Query()
            .Include(s => s.Case)
            .Include(s => s.AssignedLawyer)
            .Include(s => s.PreviousSessionLawyer)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null) return null;

        return new SessionDetailDto
        {
            Id = session.Id,
            CaseId = session.CaseId,
            CaseNumber = session.Case != null ? session.Case.CaseNumber : string.Empty,
            CaseTitle = session.Case != null ? session.Case.Title : string.Empty,
            Title = session.Title,
            ScheduledAt = session.ScheduledAt,
            CourtName = session.CourtName,
            Location = session.Location,
            CircuitNumber = session.CircuitNumber,
            Status = session.Status,
            AssignedLawyerId = session.AssignedLawyerId,
            AssignedLawyerName = session.AssignedLawyer != null ? session.AssignedLawyer.FullName : null,
            CurrentSessionRole = session.CurrentSessionRole,
            PreviousSessionRole = session.PreviousSessionRole,
            PostponementReason = session.PostponementReason,
            PreviousSessionLawyerId = session.PreviousSessionLawyerId,
            PreviousSessionLawyerName = session.PreviousSessionLawyer != null ? session.PreviousSessionLawyer.FullName : null,
            SessionProceedings = session.SessionProceedings,
            DecisionKey = session.DecisionKey,
            DecisionText = session.DecisionText,
            Notes = session.Notes,
            CreatedAt = session.CreatedAt
        };
    }

    public async Task<SessionDetailDto> CreateSessionAsync(SessionCreateDto dto, Guid createdBy)
    {
        var session = new Session
        {
            Id = Guid.NewGuid(),
            CaseId = dto.CaseId,
            Title = dto.Title,
            ScheduledAt = dto.ScheduledAt,
            CourtName = dto.CourtName,
            Location = dto.Location,
            CircuitNumber = dto.CircuitNumber,
            Status = dto.Status,
            CurrentSessionRole = dto.CurrentSessionRole,
            AssignedLawyerId = dto.AssignedLawyerId,
            PreviousSessionRole = dto.PreviousSessionRole,
            PostponementReason = dto.PostponementReason,
            PreviousSessionLawyerId = dto.PreviousSessionLawyerId,
            SessionProceedings = dto.SessionProceedings,
            DecisionKey = dto.DecisionKey,
            DecisionText = dto.DecisionText,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        await _unitOfWork.Repository<Session>().AddAsync(session);
        await _unitOfWork.CompleteAsync();

        var created = await GetSessionByIdAsync(session.Id) ?? throw new Exception("Failed to retrieve created session");

        await _notificationService.NotifyUserAndAdminsAsync(
            session.AssignedLawyerId,
            "NOTIFICATIONS.SESSION_SCHEDULED_TITLE",
            "NOTIFICATIONS.SESSION_SCHEDULED_MSG",
            "Sessions",
            $"/cases/{session.CaseId}",
            new Dictionary<string, string> { { "number", created.CaseNumber }, { "court", session.CourtName } });

        return created;
    }

    public async Task UpdateSessionAsync(Guid id, SessionUpdateDto dto)
    {
        var session = await _unitOfWork.Repository<Session>().GetByIdAsync(id);
        if (session == null) throw new Exception("Session not found");

        session.Title = dto.Title;
        session.CaseId = dto.CaseId;
        session.ScheduledAt = dto.ScheduledAt;
        session.CourtName = dto.CourtName;
        session.Location = dto.Location;
        session.CircuitNumber = dto.CircuitNumber;
        session.Status = dto.Status;
        session.CurrentSessionRole = dto.CurrentSessionRole;
        session.AssignedLawyerId = dto.AssignedLawyerId;
        session.PreviousSessionRole = dto.PreviousSessionRole;
        session.PostponementReason = dto.PostponementReason;
        session.PreviousSessionLawyerId = dto.PreviousSessionLawyerId;
        session.SessionProceedings = dto.SessionProceedings;
        session.DecisionKey = dto.DecisionKey;
        session.DecisionText = dto.DecisionText;
        session.Notes = dto.Notes;
        session.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Repository<Session>().Update(session);
        await _unitOfWork.CompleteAsync();
    }

    public async Task DeleteSessionAsync(Guid id)
    {
        var session = await _unitOfWork.Repository<Session>().GetByIdAsync(id);
        if (session == null) throw new Exception("Session not found");

        _unitOfWork.Repository<Session>().Delete(session);
        await _unitOfWork.CompleteAsync();
    }
}
