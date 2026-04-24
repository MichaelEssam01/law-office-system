using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class Document : BaseEntity
{
    public Guid CaseId { get; set; }
    public string FileName { get; set; } = string.Empty; // Server-side name (guid.ext)
    public string OriginalFileName { get; set; } = string.Empty; // Original name
    public string StoragePath { get; set; } = string.Empty; // Relative path in App_Data
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public DocumentCategory Category { get; set; }
    public string? Description { get; set; }
    
    public Guid UploadedBy { get; set; }

    // Navigation properties
    public virtual Case? Case { get; set; }
}
