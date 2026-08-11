using LawOffice.Application.DTOs.Clients;

namespace LawOffice.Application.Interfaces.Services;

public interface IClientService
{
    Task<IEnumerable<ClientDto>> GetAllClientsAsync();
    Task<ClientDto?> GetClientByIdAsync(Guid id);
    Task<ClientWorksDto?> GetClientWorksAsync(Guid id);
    Task<ClientDto> CreateClientAsync(CreateClientDto clientDto);
    Task UpdateClientAsync(Guid id, UpdateClientDto clientDto);
    Task DeleteClientAsync(Guid id);
}
