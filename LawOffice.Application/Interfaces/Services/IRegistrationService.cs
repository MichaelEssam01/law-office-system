using LawOffice.Application.DTOs.Registrations;

namespace LawOffice.Application.Interfaces.Services;

public interface IRegistrationService
{
    Task<IEnumerable<RegistrationListDto>> GetAllAsync(Guid? clientId = null, Guid? lawyerId = null);
    Task<RegistrationDetailDto?> GetByIdAsync(Guid id);
    Task<RegistrationDetailDto> CreateAsync(CreateRegistrationDto dto, Guid userId);
    Task<bool> UpdateAsync(UpdateRegistrationDto dto, Guid userId);
    Task<bool> DeleteAsync(Guid id);
}

