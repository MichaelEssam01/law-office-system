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

    public SessionService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<SessionListDto>> GetSessionsAsync(Guid? caseId = null, SessionStatus? status = null, DateTime? date = null)
    {
        var query = _unitOfWork.Repository<Session>().Query()
            .Include(s => s.Case)
            .AsQueryable();

        if (caseId.HasValue)
            query = query.Where(s => s.CaseId == caseId.Value);

        if (status.HasValue)
            query = query.Where(s => s.Status == status.Value);

        if (date.HasValue)
            query = query.Where(s => s.ScheduledAt.Date == date.Value.Date);

        return await query
            .OrderBy(s => s.ScheduledAt)
            .Select(s => new SessionListDto
            {
                Id = s.Id,
                CaseId = s.CaseId,
                CaseNumber = s.Case!.CaseNumber,
                CaseTitle = s.Case!.Title,
                Title = s.Title,
                ScheduledAt = s.ScheduledAt,
                CourtName = s.CourtName,
                Status = s.Status
            })
            .ToListAsync();
    }

    public async Task<SessionDetailDto?> GetSessionByIdAsync(Guid id)
    {
        var session = await _unitOfWork.Repository<Session>().Query()
            .Include(s => s.Case)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null) return null;

        return new SessionDetailDto
        {
            Id = session.Id,
            CaseId = session.CaseId,
            CaseNumber = session.Case!.CaseNumber,
            CaseTitle = session.Case!.Title,
            Title = session.Title,
            ScheduledAt = session.ScheduledAt,
            CourtName = session.CourtName,
            Status = session.Status,
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
            Status = dto.Status,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        await _unitOfWork.Repository<Session>().AddAsync(session);
        await _unitOfWork.CompleteAsync();

        return await GetSessionByIdAsync(session.Id) ?? throw new Exception("Failed to retrieve created session");
    }

    public async Task UpdateSessionAsync(Guid id, SessionUpdateDto dto)
    {
        var session = await _unitOfWork.Repository<Session>().GetByIdAsync(id);
        if (session == null) throw new Exception("Session not found");

        session.Title = dto.Title;
        session.ScheduledAt = dto.ScheduledAt;
        session.CourtName = dto.CourtName;
        session.Status = dto.Status;
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
