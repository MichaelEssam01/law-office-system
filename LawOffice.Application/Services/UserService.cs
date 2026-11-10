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
            var roles = (await _userManager.GetRolesAsync(user)).ToList();
            dtos.Add(new UserListDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email!,
                Role = roles.FirstOrDefault() ?? "No Role",
                Roles = roles,
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
            var roles = (await _userManager.GetRolesAsync(user)).ToList();
            dtos.Add(new UserListDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email!,
                Role = roles.FirstOrDefault() ?? "Lawyer",
                Roles = roles,
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

        var roles = (await _userManager.GetRolesAsync(user)).ToList();
        var roleName = roles.FirstOrDefault() ?? "Lawyer";
        var permissions = new List<string>();

        foreach (var rName in roles)
        {
            var role = await _roleManager.FindByNameAsync(rName);
            if (role != null)
            {
                var roleClaims = await _roleManager.GetClaimsAsync(role);
                permissions.AddRange(roleClaims.Where(c => c.Type == "Permission").Select(c => c.Value));
            }
        }

        return new UserDetailDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email!,
            Role = roleName,
            Roles = roles,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Permissions = permissions.Distinct().ToList()
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
            IsActive = dto.IsActive
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            throw new Exception($"Failed to create user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        var rolesToAssign = dto.Roles != null && dto.Roles.Any()
            ? dto.Roles.Distinct().ToList()
            : (!string.IsNullOrWhiteSpace(dto.Role) ? new List<string> { dto.Role } : new List<string> { "Lawyer" });

        await _userManager.AddToRolesAsync(user, rolesToAssign);

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

        if (!dto.IsActive)
        {
            await _userManager.UpdateSecurityStampAsync(user);
        }

        // Update Password if provided
        if (!string.IsNullOrEmpty(dto.Password))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            await _userManager.ResetPasswordAsync(user, token, dto.Password);
        }

        // Update Roles
        var rolesToAssign = dto.Roles != null && dto.Roles.Any()
            ? dto.Roles.Distinct().ToList()
            : (!string.IsNullOrWhiteSpace(dto.Role) ? new List<string> { dto.Role } : new List<string> { "Lawyer" });

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRolesAsync(user, rolesToAssign);

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

    private static readonly string[] SystemRoles = { "Admin", "Lawyer", "Receptionist", "Accountant" };

    public async Task<List<RolePermissionsDto>> GetRolesWithPermissionsAsync()
    {
        var allRoles = await _roleManager.Roles.ToListAsync();
        var sortedRoles = allRoles
            .OrderBy(r =>
            {
                var idx = Array.FindIndex(SystemRoles, s => string.Equals(s, r.Name, StringComparison.OrdinalIgnoreCase));
                return idx >= 0 ? idx : 100;
            })
            .ThenBy(r => r.Name)
            .ToList();

        var result = new List<RolePermissionsDto>();

        foreach (var role in sortedRoles)
        {
            var roleName = role.Name!;
            var claims = await _roleManager.GetClaimsAsync(role);
            var usersInRole = await _userManager.GetUsersInRoleAsync(roleName);

            result.Add(new RolePermissionsDto
            {
                Role = roleName,
                Permissions = claims.Where(c => c.Type == "Permission").Select(c => c.Value).Distinct().ToList(),
                UsersCount = usersInRole.Count,
                IsSystemRole = SystemRoles.Contains(roleName, StringComparer.OrdinalIgnoreCase)
            });
        }

        return result;
    }

    public async Task<RolePermissionsDto> CreateRoleAsync(CreateRoleDto dto)
    {
        var roleName = dto.RoleName?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(roleName))
        {
            throw new ArgumentException("Role name is required.");
        }

        if (await _roleManager.RoleExistsAsync(roleName))
        {
            throw new InvalidOperationException($"Role '{roleName}' already exists.");
        }

        var role = new IdentityRole<Guid>(roleName);
        var createResult = await _roleManager.CreateAsync(role);
        if (!createResult.Succeeded)
        {
            throw new Exception($"Failed to create role: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
        }

        var distinctPermissions = (dto.Permissions ?? new List<string>()).Distinct().ToList();
        foreach (var perm in distinctPermissions)
        {
            await _roleManager.AddClaimAsync(role, new Claim("Permission", perm));
        }

        return new RolePermissionsDto
        {
            Role = roleName,
            Permissions = distinctPermissions,
            UsersCount = 0,
            IsSystemRole = false
        };
    }

    public async Task<bool> UpdateRolePermissionsAsync(string roleName, List<string> permissions)
    {
        var role = await _roleManager.FindByNameAsync(roleName);
        if (role == null) return false;

        // Admin role always keeps all available permissions for safety
        var targetPermissions = string.Equals(roleName, "Admin", StringComparison.OrdinalIgnoreCase)
            ? await GetAvailablePermissionsAsync()
            : permissions.Distinct().ToList();

        var existingClaims = await _roleManager.GetClaimsAsync(role);
        var permissionClaims = existingClaims.Where(c => c.Type == "Permission").ToList();

        foreach (var claim in permissionClaims)
        {
            await _roleManager.RemoveClaimAsync(role, claim);
        }

        foreach (var perm in targetPermissions)
        {
            await _roleManager.AddClaimAsync(role, new Claim("Permission", perm));
        }

        return true;
    }

    public async Task<bool> DeleteRoleAsync(string roleName)
    {
        if (SystemRoles.Contains(roleName, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Built-in system roles cannot be deleted.");
        }

        var role = await _roleManager.FindByNameAsync(roleName);
        if (role == null) return false;

        var usersInRole = await _userManager.GetUsersInRoleAsync(roleName);
        if (usersInRole.Any())
        {
            throw new InvalidOperationException("Cannot delete a role that is currently assigned to users.");
        }

        var result = await _roleManager.DeleteAsync(role);
        return result.Succeeded;
    }
}
