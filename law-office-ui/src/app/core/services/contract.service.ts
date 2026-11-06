import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PartyCapacity, PartyType } from './case.service';

export enum ContractStatus {
  InDrafting = 1, // جاري الصياغة
  Finished = 2    // منتهي
}

export enum ContractType {
  Lease = 0,         // إيجار
  Sale = 1,          // بيع
  Gift = 2,          // هبة
  Partnership = 3,   // شركة
  Mortgage = 4,      // رهن
  Contracting = 5,   // مقاولة
  Consulting = 6,    // استشاري
  Employment = 7,    // عمل
  Marriage = 8,      // زواج
  Exploitation = 9,  // استغلال
  Usufruct = 10,     // حق انتفاع
  Other = 11         // أخرى
}

export interface ContractPartyDto {
  id?: string;
  partyType: PartyType;
  clientId?: string | null;
  name: string;
  capacity: PartyCapacity;
  hasSameCapacityOthers?: boolean;
  otherPersonName?: string | null;
  otherLawyerName?: string | null;
  opponentLawyerName?: string | null;
}

export interface ContractListDto {
  id: string;
  contractNumber: string;
  title: string;
  status: ContractStatus;
  contractType: ContractType;
  otherContractType?: string | null;
  fileNumber?: string | null;
  fileYear?: number | null;
  fileColor?: string | null;
  clientId: string;
  clientName: string;
  clientNumber?: number;
  otherPartyName?: string | null;
  assignedLawyerId?: string | null;
  lawyerName?: string | null;
  agreementDate?: string | null;
  startDate: string;
  closedDate?: string | null;
  createdAt: string;
}

export interface ContractDetailDto extends ContractListDto {
  notes?: string | null;
  parties?: ContractPartyDto[];
  createdBy: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5137/api/contracts';

  async getContracts(searchTerm?: string, status?: string, clientId?: string, lawyerId?: string): Promise<ContractListDto[]> {
    let params = new HttpParams();
    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (status) params = params.set('status', status);
    if (clientId) params = params.set('clientId', clientId);
    if (lawyerId) params = params.set('lawyerId', lawyerId);
    return firstValueFrom(this.http.get<ContractListDto[]>(this.apiUrl, { params }));
  }

  async getContractById(id: string): Promise<ContractDetailDto> {
    return firstValueFrom(this.http.get<ContractDetailDto>(`${this.apiUrl}/${id}`));
  }

  async createContract(data: any): Promise<ContractDetailDto> {
    return firstValueFrom(this.http.post<ContractDetailDto>(this.apiUrl, data));
  }

  async updateContract(id: string, data: any): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.apiUrl}/${id}`, data));
  }

  async deleteContract(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}
