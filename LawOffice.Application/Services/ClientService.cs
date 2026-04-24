using LawOffice.Application.DTOs.Clients;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;

namespace LawOffice.Application.Services;

public class ClientService : IClientService
{
    private readonly IRepository<Client> _clientRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ClientService(IRepository<Client> clientRepository, IUnitOfWork unitOfWork)
    {
        _clientRepository = clientRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ClientDto>> GetAllClientsAsync()
    {
        var clients = await _clientRepository.GetAllAsync();
        return clients.Select(MapToDto);
    }

    public async Task<ClientDto?> GetClientByIdAsync(Guid id)
    {
        var client = await _clientRepository.GetByIdAsync(id);
        if (client == null) return null;
        
        return MapToDto(client);
    }

    public async Task<ClientDto> CreateClientAsync(CreateClientDto clientDto)
    {
        var client = new Client
        {
            FullName = clientDto.FullName,
            Phone = clientDto.Phone,
            Email = clientDto.Email,
            Address = clientDto.Address,
            NationalId = clientDto.NationalId
        };

        await _clientRepository.AddAsync(client);
        await _unitOfWork.CompleteAsync();

        return MapToDto(client);
    }

    public async Task UpdateClientAsync(Guid id, UpdateClientDto clientDto)
    {
        var client = await _clientRepository.GetByIdAsync(id);
        if (client == null) throw new KeyNotFoundException($"Client with Id {id} not found.");

        client.FullName = clientDto.FullName;
        client.Phone = clientDto.Phone;
        client.Email = clientDto.Email;
        client.Address = clientDto.Address;
        client.NationalId = clientDto.NationalId;
        client.UpdatedAt = DateTime.UtcNow;

        _clientRepository.Update(client);
        await _unitOfWork.CompleteAsync();
    }

    public async Task DeleteClientAsync(Guid id)
    {
        var client = await _clientRepository.GetByIdAsync(id);
        if (client == null) throw new KeyNotFoundException($"Client with Id {id} not found.");

        _clientRepository.Delete(client);
        await _unitOfWork.CompleteAsync();
    }

    private static ClientDto MapToDto(Client client)
    {
        return new ClientDto
        {
            Id = client.Id,
            FullName = client.FullName,
            Phone = client.Phone,
            Email = client.Email,
            Address = client.Address,
            NationalId = client.NationalId
        };
    }
}
