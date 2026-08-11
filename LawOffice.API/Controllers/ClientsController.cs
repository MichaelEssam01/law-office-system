using LawOffice.Application.DTOs.Clients;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Application.Common.Security;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly IClientService _clientService;

    public ClientsController(IClientService clientService)
    {
        _clientService = clientService;
    }

    [Authorize(Policy = Permissions.Clients.View)]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClientDto>>> GetAll()
    {
        var clients = await _clientService.GetAllClientsAsync();
        return Ok(clients);
    }

    [Authorize(Policy = Permissions.Clients.View)]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClientDto>> GetById(Guid id)
    {
        var client = await _clientService.GetClientByIdAsync(id);
        if (client == null) return NotFound();
        return Ok(client);
    }

    [Authorize(Policy = Permissions.Clients.View)]
    [HttpGet("{id:guid}/works")]
    public async Task<ActionResult<ClientWorksDto>> GetWorks(Guid id)
    {
        var works = await _clientService.GetClientWorksAsync(id);
        if (works == null) return NotFound();
        return Ok(works);
    }

    [Authorize(Policy = Permissions.Clients.Create)]
    [HttpPost]
    public async Task<ActionResult<ClientDto>> Create([FromBody] CreateClientDto createDto)
    {
        try
        {
            var client = await _clientService.CreateClientAsync(createDto);
            return CreatedAtAction(nameof(GetById), new { id = client.Id }, client);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = Permissions.Clients.Update)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClientDto updateDto)
    {
        try
        {
            await _clientService.UpdateClientAsync(id, updateDto);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = Permissions.Clients.Delete)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _clientService.DeleteClientAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
