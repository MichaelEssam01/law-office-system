using LawOffice.Application.DTOs.Documents;

namespace LawOffice.Application.Interfaces.Services;

public interface IDocumentService
{
    Task<IEnumerable<DocumentDto>> GetCaseDocumentsAsync(Guid caseId);
    Task<IEnumerable<DocumentDto>> GetAllDocumentsAsync();
    Task<DocumentDto> UploadDocumentAsync(UploadDocumentDto dto, Stream fileStream, string fileName, string contentType, long fileSize, Guid userId);
    Task<(byte[] FileContents, string ContentType, string FileName)> DownloadDocumentAsync(Guid id);
    Task DeleteDocumentAsync(Guid id);
}
