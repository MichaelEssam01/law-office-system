using LawOffice.Application.DTOs.Documents;
using LawOffice.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;
    public DocumentsController(IDocumentService documentService) => _documentService = documentService;

    [HttpGet("case/{caseId}")]
    public async Task<ActionResult<IEnumerable<DocumentDto>>> GetCaseDocuments(Guid caseId)
        => Ok(await _documentService.GetCaseDocumentsAsync(caseId));

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<DocumentDto>> UploadDocument([FromForm] UploadDocumentDto dto, IFormFile file)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        using var stream = file.OpenReadStream();
        var doc = await _documentService.UploadDocumentAsync(
            dto, 
            stream, 
            file.FileName, 
            file.ContentType, 
            file.Length, 
            userId);
            
        return Ok(doc);
    }

    [HttpGet("download/{id}")]
    public async Task<IActionResult> DownloadDocument(Guid id)
    {
        var (fileContents, contentType, fileName) = await _documentService.DownloadDocumentAsync(id);
        return File(fileContents, contentType, fileName);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        await _documentService.DeleteDocumentAsync(id);
        return NoContent();
    }
}
