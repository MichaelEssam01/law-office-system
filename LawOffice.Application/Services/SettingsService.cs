using LawOffice.Application.DTOs.Settings;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace LawOffice.Application.Services;

public class SettingsService : ISettingsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;

    public SettingsService(IUnitOfWork unitOfWork, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
    }

    public async Task<SystemSettingDto> GetSettingsAsync()
    {
        var settings = await _unitOfWork.Repository<SystemSetting>().Query().OrderBy(s => s.CreatedAt).FirstOrDefaultAsync();
        
        if (settings == null)
        {
            settings = CreateDefaultSettings();
            await _unitOfWork.Repository<SystemSetting>().AddAsync(settings);
            await _unitOfWork.CompleteAsync();
        }
        else if (string.IsNullOrWhiteSpace(settings.FirmName))
        {
            // If the record exists but is blank, populate it from config
            PopulateFromConfig(settings);
            await _unitOfWork.CompleteAsync();
        }

        return new SystemSettingDto
        {
            FirmName = settings.FirmName,
            LawyerName = settings.LawyerName,
            Address = settings.Address,
            Phone = settings.Phone,
            Email = settings.Email,
            TaxNumber = settings.TaxNumber
        };
    }

    public async Task<PublicSettingDto> GetPublicSettingsAsync()
    {
        var settings = await _unitOfWork.Repository<SystemSetting>().Query().OrderBy(s => s.CreatedAt).FirstOrDefaultAsync();
        
        if (settings == null || string.IsNullOrWhiteSpace(settings.FirmName))
        {
            var firmName = _configuration["SeedData:DefaultSettings:FirmName"] ?? string.Empty;
            return new PublicSettingDto { FirmName = firmName };
        }

        return new PublicSettingDto
        {
            FirmName = settings.FirmName
        };
    }

    public async Task UpdateSettingsAsync(SystemSettingDto dto)
    {
        var settings = await _unitOfWork.Repository<SystemSetting>().Query().OrderBy(s => s.CreatedAt).FirstOrDefaultAsync();
        
        if (settings == null)
        {
            settings = CreateDefaultSettings();
            await _unitOfWork.Repository<SystemSetting>().AddAsync(settings);
        }

        settings.FirmName = dto.FirmName;
        settings.LawyerName = dto.LawyerName;
        settings.Address = dto.Address;
        settings.Phone = dto.Phone;
        settings.Email = dto.Email;
        settings.TaxNumber = dto.TaxNumber;

        await _unitOfWork.CompleteAsync();
    }

    private SystemSetting CreateDefaultSettings()
    {
        var settings = new SystemSetting { Id = Guid.NewGuid() };
        PopulateFromConfig(settings);
        return settings;
    }

    private void PopulateFromConfig(SystemSetting settings)
    {
        var settingsSection = _configuration.GetSection("SeedData:DefaultSettings");
        settings.FirmName = settingsSection["FirmName"] ?? string.Empty;
        settings.LawyerName = settingsSection["LawyerName"] ?? string.Empty;
        settings.Email = settingsSection["Email"] ?? string.Empty;
        settings.Phone = settingsSection["Phone"] ?? string.Empty;
        settings.Address = settingsSection["Address"] ?? string.Empty;
        settings.TaxNumber = settingsSection["TaxNumber"] ?? string.Empty;
    }
}
