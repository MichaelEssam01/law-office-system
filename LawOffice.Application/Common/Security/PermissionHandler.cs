using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace LawOffice.Application.Common.Security;

public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }
}

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        // If user is not authenticated, they can't have permissions
        if (context.User == null || !context.User.Identity?.IsAuthenticated == true)
        {
            return Task.CompletedTask;
        }

        // Check if the user has the required permission claim
        // In ASP.NET Core Identity, Role claims are usually automatically loaded into the User principal
        var hasPermission = context.User.Claims.Any(c => 
            c.Type == "Permission" && 
            c.Value == requirement.Permission);

        if (hasPermission)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
