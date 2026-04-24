using LawOffice.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace LawOffice.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedRolesAndAdminAsync(RoleManager<IdentityRole<Guid>> roleManager, UserManager<User> userManager, IConfiguration configuration)
    {
        // Seed Roles
        string[] roles = { "Admin", "Lawyer", "Receptionist", "Accountant" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
            }
        }

        // Seed Admin User
        var adminEmail = configuration["SeedData:AdminEmail"] ?? "admin@lawoffice.com";
        var adminPassword = configuration["SeedData:AdminPassword"] ?? "Admin@123";

        if (await userManager.FindByEmailAsync(adminEmail) == null)
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
    }
}
