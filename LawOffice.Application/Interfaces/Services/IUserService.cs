using LawOffice.Application.DTOs.Users;

namespace LawOffice.Application.Interfaces.Services;

public interface IUserService
{
    Task<IEnumerable<UserListDto>> GetAllUsersAsync();
    Task<IEnumerable<UserListDto>> GetLawyersAsync();
    Task<UserDetailDto?> GetUserByIdAsync(Guid id);
    Task<UserDetailDto> CreateUserAsync(CreateUserDto dto);
    Task<bool> UpdateUserAsync(UpdateUserDto dto);
    Task<bool> DeleteUserAsync(Guid id);
    Task<List<string>> GetAvailablePermissionsAsync();
}
