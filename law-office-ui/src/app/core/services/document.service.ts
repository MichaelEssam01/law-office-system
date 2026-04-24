import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export enum DocumentCategory {
  Contract = 0,
  CourtDocument = 1,
  Evidence = 2,
  Invoice = 3,
  Other = 4
}

export interface DocumentDto {
  id: string;
  caseId: string;
  originalFileName: string;
  fileSize: number;
  contentType: string;
  category: DocumentCategory;
  description?: string;
  uploadedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5137/api/documents';

  async getCaseDocuments(caseId: string): Promise<DocumentDto[]> {
    return firstValueFrom(this.http.get<DocumentDto[]>(`${this.baseUrl}/case/${caseId}`));
  }

  async uploadDocument(caseId: string, file: File, category: DocumentCategory, description?: string): Promise<DocumentDto> {
    const formData = new FormData();
    formData.append('caseId', caseId);
    formData.append('file', file);
    formData.append('category', category.toString());
    if (description) formData.append('description', description);

    return firstValueFrom(this.http.post<DocumentDto>(`${this.baseUrl}/upload`, formData));
  }

  async downloadDocument(id: string, fileName: string): Promise<void> {
    const blob = await firstValueFrom(this.http.get(`${this.baseUrl}/download/${id}`, { responseType: 'blob' }));
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async deleteDocument(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }
}
