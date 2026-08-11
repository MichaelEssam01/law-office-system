using LawOffice.Application.DTOs.Settings;

namespace LawOffice.Application.Interfaces.Services;

public interface ISettingsService
{
    Task<SystemSettingDto> GetSettingsAsync();
    Task<PublicSettingDto> GetPublicSettingsAsync();
    Task UpdateSettingsAsync(SystemSettingDto dto);
}
