import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DisputeNature, PartyCapacity, PartyType } from './case.service';

export enum CompanyStatus {
  Active = 1,   // قائمة
  Finished = 2  // منتهية
}

export enum CompanyType {
  GeneralPartnership = 0,         // تضامن
  LimitedPartnership = 1,         // توصية
  PartnershipLimitedByShares = 2, // توصية بالأسهم
  LimitedLiability = 3,           // ذات مسئولية محدودة
  JointStock = 4,                 // مساهمة
  DeFacto = 5,                    // واقع
  Other = 6                       // أخرى
}

export interface CompanyPartyDto {
  id?: string;
  partyType: PartyType;
  clientId?: string | null;
  name: string;
  capacity: PartyCapacity;
  disputeNature: DisputeNature;
  hasSameCapacityOthers?: boolean;
  otherPersonName?: string | null;
  otherLawyerName?: string | null;
  opponentLawyerName?: string | null;
}

export interface CompanyListDto {
  id: string;
  companyCode: string;
  title: string;
  status: CompanyStatus;
  companyType: CompanyType;
  otherCompanyType?: string | null;
  companyNumber?: string | null;
  companyDuration?: string | null;
  authorityDetails?: string | null;
  fileNumber?: string | null;
  fileYear?: number | null;
  fileColor?: string | null;
  taxNumber?: string | null;
  result?: string | null;
  clientId: string;
  clientName: string;
  clientNumber?: number;
  opponentName?: string | null;
  assignedLawyerId?: string | null;
  lawyerName?: string | null;
  agreementDate?: string | null;
  startDate: string;
  filingDate?: string | null;
  closedDate?: string | null;
  createdAt: string;
}

export interface CompanyDetailDto extends CompanyListDto {
  contractProcedure?: string | null;
  registryProcedure?: string | null;
  registrationPlace?: string | null;
  subsequentProcedures?: string | null;
  valueAddedTax?: string | null;
  notes?: string | null;
  parties?: CompanyPartyDto[];
  createdBy: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5137/api/companies';

  async getCompanies(searchTerm?: string, status?: string, clientId?: string, lawyerId?: string): Promise<CompanyListDto[]> {
    let params = new HttpParams();
    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (status) params = params.set('status', status);
    if (clientId) params = params.set('clientId', clientId);
    if (lawyerId) params = params.set('lawyerId', lawyerId);
    return firstValueFrom(this.http.get<CompanyListDto[]>(this.apiUrl, { params }));
  }

  async getCompanyById(id: string): Promise<CompanyDetailDto> {
    return firstValueFrom(this.http.get<CompanyDetailDto>(`${this.apiUrl}/${id}`));
  }

  async createCompany(data: any): Promise<CompanyDetailDto> {
    return firstValueFrom(this.http.post<CompanyDetailDto>(this.apiUrl, data));
  }

  async updateCompany(id: string, data: any): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.apiUrl}/${id}`, data));
  }

  async deleteCompany(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}
