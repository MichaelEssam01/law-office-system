import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface DashboardStatsDto {
  totalClients: number;
  totalCases: number;
  openCasesCount: number;
  upcomingSessionsCount: number;
  totalInvoiced: number;
  totalPaid: number;
  pendingBalance: number;
  totalCancelled: number;
  overdueInvoicesCount: number;
  totalDocuments: number;
  casesByStatus: { label: string; value: number }[];
  last6MonthsFinance: { month: string; invoiced: number; paid: number }[];
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
