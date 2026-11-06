using LawOffice.Application.DTOs.Contracts;

namespace LawOffice.Application.Interfaces.Services;

public interface IContractService
{
    Task<IEnumerable<ContractListDto>> GetAllAsync(string? status = null, Guid? clientId = null, Guid? lawyerId = null);
    Task<ContractDetailDto?> GetByIdAsync(Guid id);
    Task<ContractDetailDto> CreateAsync(CreateContractDto dto, Guid userId);
    Task<bool> UpdateAsync(UpdateContractDto dto, Guid userId);
    Task<bool> DeleteAsync(Guid id);
}

