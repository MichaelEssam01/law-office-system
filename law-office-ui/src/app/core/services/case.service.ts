import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export enum CaseStatus {
  InProgress = 1,   // متداولة
  Pending = 2,      // معلقة
  Finished = 4,     // منتهية
  Suspended = 5     // موقوفة
}

export enum ArchivingType {
  Permanent = 0,    // حفظ دائم
  Temporary = 1,    // حفظ مؤقت
  Disposed = 2      // معدم
}

export enum CaseType {
  Administrative = 0,       // إداري
  Family = 1,               // أسرة
  Economic = 2,             // اقتصادية
  Rents = 3,                // إيجارات
  Constitutional = 4,       // دستورية
  Commercial = 5,           // تجاري
  Compensation = 6,         // تعويضات
  Enforcement = 7,          // تنفيذ
  SignatureValidity = 8,    // صحة توقيع
  Labor = 9,                // عمال
  Civil = 10,               // مدني
  CivilAppealed = 11,       // مدني مستأنف
  Urgent = 12,              // مستعجل
  Criminal = 13,            // جنائي
  Other = 14                // أخرى
}

export enum FamilyCaseSubtype {
  Financial = 0,            // مال
  Miscellaneous = 1,        // متنوع
  Imprisonment = 2,         // حبس
  Inheritance = 3           // وراثة
}

export enum YearType {
  Gregorian = 0,            // ميلادي
  Judicial = 1              // قضائي
}

export enum LitigationDegree {
  Summary = 0,              // جزئي
  FirstInstance = 1,        // ابتدائي
  AdministrativeCourt = 2,  // إدارية
  StateCouncil = 3,         // قضاء إداري
  Appellate = 4,            // استئناف
  Cassation = 5,            // نقض
  Constitutional = 6,       // دستورية
  Supreme = 7,              // عليا
  Other = 8                 // أخرى
}

export enum PartyCapacity {
  Plaintiff = 0,            // مدعي
  Defendant = 1,            // مدعى عليه
  OffensiveIntervener = 2,  // متدخل هجومي
  AdhesiveIntervener = 3,   // متدخل انضمامي
  JoinedParty = 4,          // مدخل
  Appellant = 5,            // مستأنف
  Appellee = 6,             // مستأنف ضده
  Challenger = 7,           // طاعن
  Respondent = 8,           // مطعون ضده
  Victim = 9,               // مجني عليه
  Accused = 10,             // متهم
  CivilRightPlaintiff = 11, // مدعي بالحق المدني
  Other = 12                // أخرى
}

export enum DisputeNature {
  Original = 0,             // أصلي
  Confrontational = 1       // في المواجهة
}

export enum PartyType {
  Client = 0,               // عميل
  Opponent = 1              // خصم
}

export interface CasePartyDto {
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

export interface CaseListDto {
  id: string;
  caseNumber: string;
  title: string;
  subject?: string;
  status: CaseStatus;
  archivingType?: ArchivingType;
  caseType?: CaseType;
  familyCaseSubtype?: FamilyCaseSubtype;
  litigationDegree?: LitigationDegree;
  courtCaseNumber?: string;
  yearType?: YearType;
  year?: number;
  fileNumber?: string;
  fileYear?: number;
  fileColor?: string;
  hasOfficeAction?: boolean | null;
  hasCourtAction?: boolean | null;
  hasExternalAction?: boolean | null;
  hasOtherAction?: boolean | null;
  suspensionReason?: string | null;
  clientName: string;
  clientNumber?: number;
  opponentName?: string;
  clientId: string;
  lawyerName?: string;
  startDate: string;
  closedDate?: string;
  createdAt: string;
}

export interface CaseDetailDto extends CaseListDto {
  description: string;
  agreementDate?: string;
  courtFilingDate?: string;
  closedDate?: string;
  familyCaseSubtype?: FamilyCaseSubtype;
  yearType?: YearType;
  year?: number;
  fileNumber?: string;
  fileYear?: number;
  fileColor?: string;
  judgmentResult?: string;
  judgmentDate?: string;
  notes?: string;
  clientId: string;
  assignedLawyerId?: string | null;
  officeAction?: string | null;
  courtAction?: string | null;
  externalAction?: string | null;
  otherAction?: string | null;
  hasOfficeAction?: boolean | null;
  hasCourtAction?: boolean | null;
  hasExternalAction?: boolean | null;
  hasOtherAction?: boolean | null;
  suspensionReason?: string | null;
  suspensionDocumentsText?: string | null;
  suspensionOtherText?: string | null;
  parties?: CasePartyDto[];
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
    if (filters?.status !== undefined && filters?.status !== null && filters?.status !== '') {
      params = params.set('status', filters.status);
    }
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
