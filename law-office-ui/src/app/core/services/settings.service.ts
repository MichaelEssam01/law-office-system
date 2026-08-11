import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface SystemSettingDto {
  firmName: string;
  lawyerName: string;
  address: string;
  phone: string;
  email: string;
  taxNumber?: string;
}

export interface PublicSettingDto {
  firmName: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5137/api/settings';

  async getSettings(): Promise<SystemSettingDto> {
    return firstValueFrom(this.http.get<SystemSettingDto>(this.apiUrl));
  }

  async getPublicSettings(): Promise<PublicSettingDto> {
    return firstValueFrom(this.http.get<PublicSettingDto>(`${this.apiUrl}/public`));
  }

  async updateSettings(settings: SystemSettingDto): Promise<void> {
    return firstValueFrom(this.http.put<void>(this.apiUrl, settings));
  }
}
