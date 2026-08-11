using LawOffice.Domain.Entities;
using LawOffice.Application.Common.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;

namespace LawOffice.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedRolesAndAdminAsync(RoleManager<IdentityRole<Guid>> roleManager, UserManager<User> userManager, ApplicationDbContext context, IConfiguration configuration)
    {
        string[] roles = { "Admin", "Lawyer", "Receptionist", "Accountant" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
            }
        }

        await SeedRolePermissions(roleManager);

        // Seed Admin User
        var adminEmail = configuration["SeedData:AdminEmail"];
        var adminPassword = configuration["SeedData:AdminPassword"];

        if (string.IsNullOrEmpty(adminEmail) || string.IsNullOrEmpty(adminPassword))
        {
            return; // Don't seed if credentials are missing
        }

        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
        if (existingAdmin == null)
        {
            var adminUser = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "System Admin",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(adminUser, adminPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
        else
        {
            // In development, we force the password to match the seed config for convenience
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(existingAdmin);
            await userManager.ResetPasswordAsync(existingAdmin, resetToken, adminPassword);
            
            // Unlock account if it was locked out during dev testing
            await userManager.SetLockoutEndDateAsync(existingAdmin, null);
            await userManager.ResetAccessFailedCountAsync(existingAdmin);

            // Ensure Admin has the correct role
            if (!await userManager.IsInRoleAsync(existingAdmin, "Admin"))
            {
                await userManager.AddToRoleAsync(existingAdmin, "Admin");
            }
        }

        var testUsers = configuration.GetSection("SeedData:TestUsers").GetChildren();
        foreach (var testUser in testUsers)
        {
            var email = testUser["Email"];
            if (email != null)
            {
                var existingUser = await userManager.FindByEmailAsync(email);
                if (existingUser == null)
                {
                    var user = new User
                    {
                        UserName = email,
                        Email = email,
                        FullName = testUser["FullName"] ?? "Test User",
                        EmailConfirmed = true
                    };
                    var result = await userManager.CreateAsync(user, adminPassword);
                    if (result.Succeeded)
                    {
                        var role = testUser["Role"] ?? "Lawyer";
                        await userManager.AddToRoleAsync(user, role);
                    }
                }
                else
                {
                    // Force password reset for test users in dev
                    var resetToken = await userManager.GeneratePasswordResetTokenAsync(existingUser);
                    await userManager.ResetPasswordAsync(existingUser, resetToken, adminPassword);
                    
                    // Unlock account
                    await userManager.SetLockoutEndDateAsync(existingUser, null);
                    await userManager.ResetAccessFailedCountAsync(existingUser);
                }
            }
        }

        if (!context.SystemSettings.Any())
        {
            var settingsSection = configuration.GetSection("SeedData:DefaultSettings");
            if (settingsSection.Exists())
            {
                context.SystemSettings.Add(new SystemSetting
                {
                    Id = Guid.NewGuid(),
                    FirmName = settingsSection["FirmName"] ?? string.Empty,
                    LawyerName = settingsSection["LawyerName"] ?? string.Empty,
                    Email = settingsSection["Email"] ?? string.Empty,
                    Phone = settingsSection["Phone"] ?? string.Empty,
                    Address = settingsSection["Address"] ?? string.Empty,
                    TaxNumber = settingsSection["TaxNumber"] ?? string.Empty,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
        }
    }

    private static async Task SeedRolePermissions(RoleManager<IdentityRole<Guid>> roleManager)
    {
        // Admin: All Permissions
        await AssignAllPermissions(roleManager, "Admin");

        // Lawyer
        await AssignPermissions(roleManager, "Lawyer", new[] {
            Permissions.Cases.View,
            Permissions.Cases.Update,
            Permissions.Clients.View
        });

        // Receptionist
        await AssignPermissions(roleManager, "Receptionist", new[] {
            Permissions.Clients.View,
            Permissions.Clients.Create,
            Permissions.Clients.Update,
            Permissions.Cases.View,
            Permissions.Cases.Create
        });
    }

    private static async Task AssignAllPermissions(RoleManager<IdentityRole<Guid>> roleManager, string roleName)
    {
        var allPermissions = typeof(Permissions).GetNestedTypes()
            .SelectMany(t => t.GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.FlattenHierarchy))
            .Where(f => f.IsLiteral && !f.IsInitOnly)
            .Select(f => f.GetRawConstantValue()?.ToString())
            .Where(v => v != null)
            .Cast<string>();

        await AssignPermissions(roleManager, roleName, allPermissions);
    }

    private static async Task AssignPermissions(RoleManager<IdentityRole<Guid>> roleManager, string roleName, IEnumerable<string> permissions)
    {
        var role = await roleManager.FindByNameAsync(roleName);
        if (role == null) return;

        var existingClaims = await roleManager.GetClaimsAsync(role);
        foreach (var permission in permissions)
        {
            if (!existingClaims.Any(c => c.Type == "Permission" && c.Value == permission))
            {
                await roleManager.AddClaimAsync(role, new Claim("Permission", permission));
            }
        }
    }
}
