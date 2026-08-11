using LawOffice.Application.Common.Security;
using LawOffice.Application.DTOs.Users;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using LawOffice.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LawOffice.Application.Services;

public class UserService : IUserService
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;

    public UserService(UserManager<User> userManager, RoleManager<IdentityRole<Guid>> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task<IEnumerable<UserListDto>> GetAllUsersAsync()
    {
        var users = await _userManager.Users.ToListAsync();
        var dtos = new List<UserListDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            dtos.Add(new UserListDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email!,
                Role = roles.FirstOrDefault() ?? "No Role",
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            });
        }

        return dtos;
    }

    public async Task<IEnumerable<UserListDto>> GetLawyersAsync()
    {
        var lawyers = await _userManager.GetUsersInRoleAsync("Lawyer");
        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        
        var allLawyers = lawyers.Union(admins).Where(u => u.IsActive).DistinctBy(u => u.Id).ToList();

        var dtos = new List<UserListDto>();
        foreach (var user in allLawyers)
        {
            var roles = await _userManager.GetRolesAsync(user);
            dtos.Add(new UserListDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email!,
                Role = roles.FirstOrDefault() ?? "Lawyer",
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            });
        }

        return dtos;
    }

    public async Task<UserDetailDto?> GetUserByIdAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return null;

        var roles = await _userManager.GetRolesAsync(user);
        var claims = await _userManager.GetClaimsAsync(user);

        return new UserDetailDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email!,
            Role = roles.FirstOrDefault() ?? "Lawyer",
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Permissions = claims.Where(c => c.Type == "Permission").Select(c => c.Value).ToList()
        };
    }

    public async Task<UserDetailDto> CreateUserAsync(CreateUserDto dto)
    {
        var user = new User
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            throw new Exception($"Failed to create user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        await _userManager.AddToRoleAsync(user, dto.Role);

        foreach (var permission in dto.Permissions)
        {
            await _userManager.AddClaimAsync(user, new Claim("Permission", permission));
        }

        return (await GetUserByIdAsync(user.Id))!;
    }

    public async Task<bool> UpdateUserAsync(UpdateUserDto dto)
    {
        var user = await _userManager.FindByIdAsync(dto.Id.ToString());
        if (user == null) return false;

        user.FullName = dto.FullName;
        user.IsActive = dto.IsActive;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded) return false;

        // Update Password if provided
        if (!string.IsNullOrEmpty(dto.Password))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            await _userManager.ResetPasswordAsync(user, token, dto.Password);
        }

        // Update Role
        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, dto.Role);

        // Update Permissions (Claims)
        var currentClaims = await _userManager.GetClaimsAsync(user);
        var permissionClaims = currentClaims.Where(c => c.Type == "Permission").ToList();
        
        foreach (var claim in permissionClaims)
        {
            await _userManager.RemoveClaimAsync(user, claim);
        }

        foreach (var permission in dto.Permissions)
        {
            await _userManager.AddClaimAsync(user, new Claim("Permission", permission));
        }

        return true;
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return false;

        var result = await _userManager.DeleteAsync(user);
        return result.Succeeded;
    }

    public async Task<List<string>> GetAvailablePermissionsAsync()
    {
        var permissions = typeof(Permissions).GetNestedTypes()
            .SelectMany(t => t.GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.FlattenHierarchy))
            .Where(f => f.IsLiteral && !f.IsInitOnly)
            .Select(f => f.GetRawConstantValue()?.ToString())
            .Where(v => v != null)
            .Cast<string>()
            .ToList();

        return await Task.FromResult(permissions);
    }
}
