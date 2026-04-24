using LawOffice.Application.DTOs.Sessions;
using LawOffice.Domain.Enums;

namespace LawOffice.Application.Interfaces.Services;

public interface ISessionService
{
    Task<IEnumerable<SessionListDto>> GetSessionsAsync(Guid? caseId = null, SessionStatus? status = null, DateTime? date = null);
    Task<SessionDetailDto?> GetSessionByIdAsync(Guid id);
    Task<SessionDetailDto> CreateSessionAsync(SessionCreateDto dto, Guid createdBy);
    Task UpdateSessionAsync(Guid id, SessionUpdateDto dto);
    Task DeleteSessionAsync(Guid id);
}
