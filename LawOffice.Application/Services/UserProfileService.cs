using LawOffice.Application.DTOs.Profile;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Application.Services;

public class UserProfileService : IUserProfileService
{
    private readonly IUnitOfWork _unitOfWork;

    public UserProfileService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<SecurityLogDto>> GetSecurityLogsAsync(Guid userId)
    {
        return await _unitOfWork.Repository<UserSecurityLog>().Query()
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.Timestamp)
            .Take(20)
            .Select(l => new SecurityLogDto
            {
                Event = l.Event,
                Timestamp = l.Timestamp,
                Device = l.Device,
                IpAddress = l.IpAddress,
                Status = l.Status
            })
            .ToListAsync();
    }

    public async Task<NotificationSettingsDto> GetNotificationSettingsAsync(Guid userId)
    {
        var settings = await _unitOfWork.Repository<UserNotificationSetting>().Query()
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            // Return defaults if not found
            return new NotificationSettingsDto
            {
                EmailCases = true,
                EmailSessions = true,
                AppCases = true,
                AppSessions = true,
                AppFinance = true
            };
        }

        return new NotificationSettingsDto
        {
            EmailCases = settings.EmailCases,
            EmailSessions = settings.EmailSessions,
            EmailFinance = settings.EmailFinance,
            AppCases = settings.AppCases,
            AppSessions = settings.AppSessions,
            AppFinance = settings.AppFinance
        };
    }

    public async Task UpdateNotificationSettingsAsync(Guid userId, NotificationSettingsDto dto)
    {
        var settings = await _unitOfWork.Repository<UserNotificationSetting>().Query()
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            settings = new UserNotificationSetting { UserId = userId };
            await _unitOfWork.Repository<UserNotificationSetting>().AddAsync(settings);
        }

        settings.EmailCases = dto.EmailCases;
        settings.EmailSessions = dto.EmailSessions;
        settings.EmailFinance = dto.EmailFinance;
        settings.AppCases = dto.AppCases;
        settings.AppSessions = dto.AppSessions;
        settings.AppFinance = dto.AppFinance;

        await _unitOfWork.CompleteAsync();
    }

    public async Task AddSecurityLogAsync(Guid userId, string @event, string device, string ip, string status = "Success")
    {
        var log = new UserSecurityLog
        {
            UserId = userId,
            Event = @event,
            Device = device,
            IpAddress = ip,
            Status = status,
            Timestamp = DateTime.UtcNow
        };

        await _unitOfWork.Repository<UserSecurityLog>().AddAsync(log);
        await _unitOfWork.CompleteAsync();
    }
    
    public async Task<byte[]> ExportSecurityLogsCsvAsync(Guid userId)
    {
        var logs = await _unitOfWork.Repository<UserSecurityLog>().Query()
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.Timestamp)
            .ToListAsync();

        using (var workbook = new ClosedXML.Excel.XLWorkbook())
        {
            var worksheet = workbook.Worksheets.Add("Security Logs");
            
            // Header
            worksheet.Cell(1, 1).Value = "Event";
            worksheet.Cell(1, 2).Value = "Date (UTC)";
            worksheet.Cell(1, 3).Value = "Device";
            worksheet.Cell(1, 4).Value = "IP Address";
            worksheet.Cell(1, 5).Value = "Status";

            // Style header
            var headerRow = worksheet.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGray;

            // Data
            for (int i = 0; i < logs.Count; i++)
            {
                var log = logs[i];
                int row = i + 2;
                worksheet.Cell(row, 1).Value = log.Event;
                worksheet.Cell(row, 2).Value = log.Timestamp;
                worksheet.Cell(row, 3).Value = log.Device;
                worksheet.Cell(row, 4).Value = log.IpAddress;
                worksheet.Cell(row, 5).Value = log.Status;
            }

            // Auto-fit columns
            worksheet.Columns().AdjustToContents();

            using (var stream = new System.IO.MemoryStream())
            {
                workbook.SaveAs(stream);
                return stream.ToArray();
            }
        }
    }
}
