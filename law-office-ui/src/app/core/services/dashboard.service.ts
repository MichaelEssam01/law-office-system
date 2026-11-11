import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface MonthlyFinancialPoint {
  month: string;
  invoiced: number;
  paid: number;
}

export interface LawyerWorkloadDto {
  lawyerId: string;
  lawyerName: string;
  activeCasesCount: number;
  activeContractsCount: number;
  activeCompaniesCount: number;
  activeRegistrationsCount: number;
  totalActiveWorks: number;
  upcomingSessionsCount: number;
}

export interface DashboardSessionDto {
  id: string;
  title: string;
  caseId?: string;
  caseNumber: string;
  courtName: string;
  scheduledAt: string;
  lawyerName?: string;
  assignedLawyerId?: string;
  clientName?: string;
  location?: string;
  circuitNumber?: string;
  currentSessionRole?: string;
  notes?: string;
  status?: string;
}

export interface DashboardActionCaseDto {
  id: string;
  caseNumber: string;
  title: string;
  clientName: string;
  clientPhone?: string;
  lawyerName?: string;
  actionType: string;
  actionDescription: string;
  startDate?: string;
  courtCaseNumber?: string;
  fileNumber?: string;
  status?: string;
  suspensionReason?: string;
}

export interface PersonalWorkspaceDto {
  myActiveCasesCount: number;
  myUpcomingSessionsCount: number;
  myTodaySessionsCount: number;
  myActiveContractsCount: number;
  myActiveCompaniesCount: number;
  myActiveRegistrationsCount: number;
  myUpcomingSessions: DashboardSessionDto[];
  myActionCases: DashboardActionCaseDto[];
}

export interface DashboardStatsDto {
  // User Access & Capability Flags
  userRoles: string[];
  permissions: string[];
  canViewFinancials: boolean;
  canViewAllCases: boolean;
  canManageUsers: boolean;
  isAdmin: boolean;
  isLawyer: boolean;

  // Firm-Wide Totals
  totalClients: number;
  newClientsThisMonth: number;

  totalCases: number;
  activeCasesCount: number;
  pendingCasesCount: number;
  suspendedCasesCount: number;
  finishedCasesCount: number;
  openCasesCount: number;

  totalContracts: number;
  activeContractsCount: number;
  draftingContractsCount: number;

  totalCompanies: number;
  activeCompaniesCount: number;

  totalRegistrations: number;
  activeRegistrationsCount: number;

  totalSessions: number;
  upcomingSessionsCount: number;
  todaySessionsCount: number;
  totalDocuments: number;

  // Financial Analytics
  totalInvoiced: number;
  totalPaid: number;
  pendingBalance: number;
  totalCancelled: number;
  overdueInvoicesCount: number;
  collectionRatePercentage: number;

  // Charts
  casesByStatus: ChartDataPoint[];
  portfolioDistribution: ChartDataPoint[];
  last6MonthsFinance: MonthlyFinancialPoint[];

  // Lawyer Workload
  lawyerWorkloads: LawyerWorkloadDto[];

  // Firm-Wide Alerts & Upcoming
  upcomingSessions: DashboardSessionDto[];
  urgentActionCases: DashboardActionCaseDto[];

  // Personal Workspace
  myWork: PersonalWorkspaceDto;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5137/api/dashboard';

  async getStats(): Promise<DashboardStatsDto> {
    return firstValueFrom(this.http.get<DashboardStatsDto>(`${this.baseUrl}/stats`));
  }
}
