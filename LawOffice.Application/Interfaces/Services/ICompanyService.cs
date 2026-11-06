using LawOffice.Application.DTOs.Companies;

namespace LawOffice.Application.Interfaces.Services;

public interface ICompanyService
{
    Task<IEnumerable<CompanyListDto>> GetAllAsync(string? status = null, Guid? clientId = null, Guid? lawyerId = null);
    Task<CompanyDetailDto?> GetByIdAsync(Guid id);
    Task<CompanyDetailDto> CreateAsync(CreateCompanyDto dto, Guid userId);
    Task<bool> UpdateAsync(UpdateCompanyDto dto, Guid userId);
    Task<bool> DeleteAsync(Guid id);
}

