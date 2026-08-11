import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface SecurityLogDto {
  event: string;
  timestamp: string;
  device: string;
  ipAddress: string;
  status: string;
}

export interface NotificationSettingsDto {
  emailCases: boolean;
  emailSessions: boolean;
  emailFinance: boolean;
  appCases: boolean;
  appSessions: boolean;
  appFinance: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5137/api/profile';

  async getSecurityLogs(): Promise<SecurityLogDto[]> {
    return firstValueFrom(this.http.get<SecurityLogDto[]>(`${this.apiUrl}/security-logs`));
  }

  async getNotificationSettings(): Promise<NotificationSettingsDto> {
    return firstValueFrom(this.http.get<NotificationSettingsDto>(`${this.apiUrl}/notifications`));
  }

  async updateNotificationSettings(settings: NotificationSettingsDto): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.apiUrl}/notifications`, settings));
  }

  async exportSecurityLogsCsv(): Promise<Blob> {
    return firstValueFrom(this.http.get(`${this.apiUrl}/security-logs/export`, { responseType: 'blob' }));
  }
}
