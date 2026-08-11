using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace LawOffice.Application.Services;

public class AuditService : IAuditService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AuditService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(IUnitOfWork unitOfWork, ILogger<AuditService> logger, IHttpContextAccessor httpContextAccessor)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(
        string action, 
        string entityName, 
        string? entityId = null, 
        Guid? userId = null, 
        string? additionalData = null, 
        string? ipAddress = null, 
        string? userAgent = null)
    {
        try
        {
            var httpContext = _httpContextAccessor.HttpContext;
            
            // Auto-fill context data if not provided
            userId ??= GetCurrentUserId(httpContext);
            ipAddress ??= ipAddress ?? httpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            userAgent ??= userAgent ?? httpContext?.Request.Headers["User-Agent"].ToString();

            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                Action = action,
                EntityName = entityName,
                EntityId = entityId,
                UserId = userId,
                AdditionalData = additionalData,
                IPAddress = ipAddress,
                UserAgent = userAgent,
                Timestamp = DateTime.UtcNow
            };

            await _unitOfWork.Repository<AuditLog>().AddAsync(auditLog);
            await _unitOfWork.CompleteAsync();
        }
        catch (Exception ex)
        {
            // Fail silently but log the error so we know audit logging is broken
            _logger.LogError(ex, "Failed to create audit log for action: {Action}", action);
        }
    }

    private static Guid? GetCurrentUserId(HttpContext? context)
    {
        var userIdString = context?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdString, out var userId) ? userId : null;
    }
}
