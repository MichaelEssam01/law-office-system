using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Users;

public class UserListDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UserDetailDto : UserListDto
{
    public List<string> Permissions { get; set; } = new();
}

public class CreateUserDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Lawyer";
    public List<string> Permissions { get; set; } = new();
}

public class UpdateUserDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Password { get; set; } // Optional: only if changing
    public string Role { get; set; } = "Lawyer";
    public bool IsActive { get; set; }
    public List<string> Permissions { get; set; } = new();
}
