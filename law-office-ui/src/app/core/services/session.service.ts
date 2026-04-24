import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export enum SessionStatus {
  Scheduled = 0,
  Completed = 1,
  Postponed = 2,
  Cancelled = 3
}

export interface SessionListDto {
  id: string;
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  title: string;
  scheduledAt: string;
  courtName: string;
  status: SessionStatus;
}

export interface SessionDetailDto extends SessionListDto {
  notes?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5137/api/sessions';

  async getSessions(filters?: { caseId?: string, status?: string, date?: string }): Promise<SessionListDto[]> {
    let params = new HttpParams();
    if (filters?.caseId) params = params.set('caseId', filters.caseId);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.date) params = params.set('date', filters.date);

    return firstValueFrom(this.http.get<SessionListDto[]>(this.apiUrl, { params }));
  }

  async getSessionById(id: string): Promise<SessionDetailDto> {
    return firstValueFrom(this.http.get<SessionDetailDto>(`${this.apiUrl}/${id}`));
  }

  async createSession(sessionData: any): Promise<SessionDetailDto> {
    return firstValueFrom(this.http.post<SessionDetailDto>(this.apiUrl, sessionData));
  }

  async updateSession(id: string, sessionData: any): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.apiUrl}/${id}`, sessionData));
  }

  async deleteSession(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}
