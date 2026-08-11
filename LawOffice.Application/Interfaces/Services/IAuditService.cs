namespace LawOffice.Application.Interfaces.Services;

public interface IAuditService
{
    Task LogAsync(
        string action, 
        string entityName, 
        string? entityId = null, 
        Guid? userId = null, 
        string? additionalData = null, 
        string? ipAddress = null, 
        string? userAgent = null);
}
