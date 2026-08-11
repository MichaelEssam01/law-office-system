using System.ComponentModel.DataAnnotations;

namespace LawOffice.Application.DTOs.Clients;

public class ClientDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
}

public class CreateClientDto
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    
    [RegularExpression(@"^\d{14}$", ErrorMessage = "National ID must be exactly 14 digits.")]
    public string NationalId { get; set; } = string.Empty;
}

public class UpdateClientDto
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    
    [RegularExpression(@"^\d{14}$", ErrorMessage = "National ID must be exactly 14 digits.")]
    public string NationalId { get; set; } = string.Empty;
}
