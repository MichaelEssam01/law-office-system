using Microsoft.AspNetCore.Identity;

namespace LawOffice.Application.Common.Security;

public class ShortLivedTokenProvider<TUser> : TotpSecurityStampBasedTokenProvider<TUser> where TUser : class
{
    public override Task<bool> CanGenerateTwoFactorTokenAsync(UserManager<TUser> manager, TUser user)
    {
        return Task.FromResult(true);
    }

    public override async Task<string> GetUserModifierAsync(string purpose, UserManager<TUser> manager, TUser user)
    {
        var userId = await manager.GetUserIdAsync(user);
        return "ShortLived:" + purpose + ":" + userId;
    }
}
