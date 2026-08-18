using LawOffice.Application.DTOs.Documents;
using LawOffice.Application.Interfaces.Repositories;
using LawOffice.Application.Interfaces.Services;
using LawOffice.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace LawOffice.Application.Services;

public class DocumentService : IDocumentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly string _uploadPath;
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB
    private readonly string[] _allowedExtensions = { ".pdf", ".jpg", ".jpeg", ".png", ".docx", ".doc" };

    public DocumentService(IUnitOfWork unitOfWork, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "uploads", "documents");
        
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
        }
    }

    public async Task<IEnumerable<DocumentDto>> GetCaseDocumentsAsync(Guid caseId)
    {
        return await _unitOfWork.Repository<Document>().Query()
            .AsNoTracking()
            .Where(d => d.CaseId == caseId)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new DocumentDto
            {
                Id = d.Id,
                CaseId = d.CaseId,
                OriginalFileName = d.OriginalFileName,
                FileSize = d.FileSize,
                ContentType = d.ContentType,
                Category = d.Category,
                Description = d.Description,
                UploadedAt = d.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<DocumentDto>> GetAllDocumentsAsync()
    {
        return await _unitOfWork.Repository<Document>().Query()
            .AsNoTracking()
            .Include(d => d.Case)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new DocumentDto
            {
                Id = d.Id,
                CaseId = d.CaseId,
                OriginalFileName = d.OriginalFileName,
                FileSize = d.FileSize,
                ContentType = d.ContentType,
                Category = d.Category,
                Description = d.Description,
                UploadedAt = d.CreatedAt,
                CaseTitle = d.Case != null ? d.Case.Title : "N/A"
            })
            .ToListAsync();
    }

    public async Task<DocumentDto> UploadDocumentAsync(UploadDocumentDto dto, Stream fileStream, string fileName, string contentType, long fileSize, Guid userId)
    {
        var caseExists = await _unitOfWork.Repository<Case>().Query().AnyAsync(c => c.Id == dto.CaseId);
        if (!caseExists) throw new Exception("Case not found");

        if (fileSize > MaxFileSize) throw new Exception("File size exceeds 10MB limit");

        var extension = Path.GetExtension(fileName).ToLower();
        if (!_allowedExtensions.Contains(extension)) throw new Exception("File type not allowed");

        var serverFileName = $"{Guid.NewGuid()}{extension}";
        var physicalPath = Path.Combine(_uploadPath, serverFileName);

        using (var stream = new FileStream(physicalPath, FileMode.Create))
        {
            await fileStream.CopyToAsync(stream);
        }

        var document = new Document
        {
            Id = Guid.NewGuid(),
            CaseId = dto.CaseId,
            FileName = serverFileName,
            OriginalFileName = fileName,
            StoragePath = Path.Combine("App_Data", "uploads", "documents", serverFileName),
            FileSize = fileSize,
            ContentType = contentType,
            Category = dto.Category,
            Description = dto.Description,
            UploadedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<Document>().AddAsync(document);
        await _unitOfWork.CompleteAsync();

        return new DocumentDto
        {
            Id = document.Id,
            CaseId = document.CaseId,
            OriginalFileName = document.OriginalFileName,
            FileSize = document.FileSize,
            ContentType = document.ContentType,
            Category = document.Category,
            Description = document.Description,
            UploadedAt = document.CreatedAt
        };
    }

    public async Task<(byte[] FileContents, string ContentType, string FileName)> DownloadDocumentAsync(Guid id)
    {
        var document = await _unitOfWork.Repository<Document>().GetByIdAsync(id);
        if (document == null) throw new Exception("Document not found");

        var physicalPath = Path.Combine(_uploadPath, document.FileName);
        if (!File.Exists(physicalPath)) throw new Exception("Physical file not found on server");

        var contents = await File.ReadAllBytesAsync(physicalPath);
        return (contents, document.ContentType, document.OriginalFileName);
    }

    public async Task DeleteDocumentAsync(Guid id)
    {
        var document = await _unitOfWork.Repository<Document>().GetByIdAsync(id);
        if (document == null) throw new Exception("Document not found");

        var physicalPath = Path.Combine(_uploadPath, document.FileName);
        if (File.Exists(physicalPath))
        {
            File.Delete(physicalPath);
        }

        _unitOfWork.Repository<Document>().Delete(document);
        await _unitOfWork.CompleteAsync();
    }
}
