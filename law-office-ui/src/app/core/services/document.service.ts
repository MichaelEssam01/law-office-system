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
  caseTitle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5137/api/documents';

  async getAllDocuments(): Promise<DocumentDto[]> {
    return firstValueFrom(this.http.get<DocumentDto[]>(this.baseUrl));
  }

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

  /**
   * Opens the document in a new browser tab (PDF, images, text are rendered inline;
   * other types such as Word/Excel fall back to the browser's download behavior).
   */
  async openDocument(id: string): Promise<void> {
    // Open the tab synchronously (inside the click handler) so popup blockers allow it.
    const newTab = window.open('', '_blank');
    try {
      const blob = await firstValueFrom(this.http.get(`${this.baseUrl}/download/${id}`, { responseType: 'blob' }));
      const url = window.URL.createObjectURL(blob);
      if (newTab) {
        newTab.location.href = url;
      } else {
        window.open(url, '_blank');
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      newTab?.close();
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }
}
