using LawOffice.Application.DTOs.Cases;

namespace LawOffice.Application.Interfaces.Services;

public interface ICaseService
{
    Task<IEnumerable<CaseListDto>> GetAllAsync(string? status = null, Guid? clientId = null, Guid? lawyerId = null);
    Task<CaseDetailDto?> GetByIdAsync(Guid id);
    Task<CaseDetailDto> CreateAsync(CreateCaseDto createCaseDto, Guid userId);
    Task<bool> UpdateAsync(UpdateCaseDto updateCaseDto, Guid userId);
    Task<bool> DeleteAsync(Guid id);
}
