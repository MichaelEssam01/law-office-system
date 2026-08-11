import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export enum CaseStatus {
  Open = 0,
  Pending = 1,
  Closed = 2
}

export interface CaseListDto {
  id: string;
  caseNumber: string;
  title: string;
  status: CaseStatus;
  clientName: string;
  clientId: string;
  lawyerName: string;
  startDate: string;
  createdAt: string;
}

export interface CaseDetailDto extends CaseListDto {
  description: string;
  closedDate?: string;
  notes?: string;
  clientId: string;
  assignedLawyerId: string;
  createdBy: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5137/api/cases';

  async getCases(filters?: { status?: string, clientId?: string, lawyerId?: string }): Promise<CaseListDto[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.clientId) params = params.set('clientId', filters.clientId);
    if (filters?.lawyerId) params = params.set('lawyerId', filters.lawyerId);

    return firstValueFrom(this.http.get<CaseListDto[]>(this.apiUrl, { params }));
  }

  async getCaseById(id: string): Promise<CaseDetailDto> {
    return firstValueFrom(this.http.get<CaseDetailDto>(`${this.apiUrl}/${id}`));
  }

  async createCase(caseData: any): Promise<CaseDetailDto> {
    return firstValueFrom(this.http.post<CaseDetailDto>(this.apiUrl, caseData));
  }

  async updateCase(id: string, caseData: any): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.apiUrl}/${id}`, caseData));
  }

  async deleteCase(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}
