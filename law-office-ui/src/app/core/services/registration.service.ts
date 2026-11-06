import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export enum RegistrationRequestType {
  InheritancePublication = 0, // إشهار إرث
  BareOwnershipSale = 1,      // بيع رقبة
  UsufructSale = 2,           // بيع منفعة
  FullOwnershipSale = 3,      // بيع رقبة ومنفعة
  Lease = 4,                  // إيجار
  Mortgage = 5,               // رهن
  AmicablePartition = 6,      // قسمة رضائية
  PetitionPublication = 7,    // إشهار صحيفة
  JudgmentPublication = 8,    // إشهار حكم
  Other = 9                   // أخرى
}

export enum RegistrationProcedureType {
  Survey = 0,          // رفع مساحي
  Application = 1,     // طلب
  DraftProject = 2,    // مشروع
  TechnicalReview = 3, // مراجعة فنية
  FinancialReview = 4, // مراجعة مالية
  Publication = 5      // إشهار
}

export interface RegistrationProcedureDto {
  id?: string;
  procedureType: RegistrationProcedureType;
  startDate?: string | null;
  completedWork?: string | null;
  obstacles?: string | null;
  requiredAction?: string | null;
  responsibleLawyerId?: string | null;
  responsibleLawyerName?: string | null;
  notes?: string | null;
}

export interface RegistrationListDto {
  id: string;
  registrationNumber: string;
  authorityName: string;
  requestType: RegistrationRequestType;
  otherRequestType?: string | null;
  fileNumber?: string | null;
  fileYear?: number | null;
  fileColor?: string | null;
  resultNumber?: string | null;
  resultDate?: string | null;
  resultAuthority?: string | null;
  clientId: string;
  clientName: string;
  clientNumber?: number;
  assignedLawyerId?: string | null;
  lawyerName?: string | null;
  activeProcedures?: RegistrationProcedureType[];
  createdAt: string;
}

export interface RegistrationDetailDto extends RegistrationListDto {
  notes?: string | null;
  procedures?: RegistrationProcedureDto[];
  createdBy: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5137/api/registrations';

  async getRegistrations(searchTerm?: string, requestType?: string, clientId?: string, lawyerId?: string): Promise<RegistrationListDto[]> {
    let params = new HttpParams();
    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (requestType) params = params.set('requestType', requestType);
    if (clientId) params = params.set('clientId', clientId);
    if (lawyerId) params = params.set('lawyerId', lawyerId);
    return firstValueFrom(this.http.get<RegistrationListDto[]>(this.apiUrl, { params }));
  }

  async getRegistrationById(id: string): Promise<RegistrationDetailDto> {
    return firstValueFrom(this.http.get<RegistrationDetailDto>(`${this.apiUrl}/${id}`));
  }

  async createRegistration(data: any): Promise<RegistrationDetailDto> {
    return firstValueFrom(this.http.post<RegistrationDetailDto>(this.apiUrl, data));
  }

  async updateRegistration(id: string, data: any): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.apiUrl}/${id}`, data));
  }

  async deleteRegistration(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}
