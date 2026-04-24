using LawOffice.Domain.Enums;

namespace LawOffice.Application.DTOs.Documents;

public class DocumentDto
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public DocumentCategory Category { get; set; }
    public string? Description { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class UploadDocumentDto
{
    public Guid CaseId { get; set; }
    public DocumentCategory Category { get; set; }
    public string? Description { get; set; }
}
