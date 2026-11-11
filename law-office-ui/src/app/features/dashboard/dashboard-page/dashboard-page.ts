import { Component, OnInit, OnDestroy, inject, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DashboardService, DashboardStatsDto, LawyerWorkloadDto, DashboardSessionDto, DashboardActionCaseDto } from '../../../core/services/dashboard.service';
import { SessionService, SessionDetailDto, SessionListDto, SessionStatus } from '../../../core/services/session.service';
import { CaseService, CaseDetailDto } from '../../../core/services/case.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { AutoSelectFilterDirective } from '../../../core/directives/auto-select-filter.directive';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ChartModule,
    ButtonModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    TooltipModule,
    SelectModule,
    DialogModule,
    AutoSelectFilterDirective,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './dashboard-page.html'
})
export class DashboardPage implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private sessionService = inject(SessionService);
  private caseService = inject(CaseService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);
  public cdr = inject(ChangeDetectorRef);

  stats = signal<DashboardStatsDto | null>(null);
  loading = signal(true);
  currentTab = signal<'OVERVIEW' | 'MY_WORK'>('OVERVIEW');
  selectedViewMode = signal<string>('ALL');

  // Interactive Modals State
  showLawyerSessionsDialog = false;
  selectedLawyer: LawyerWorkloadDto | null = null;
  lawyerSessions: (SessionListDto | DashboardSessionDto)[] = [];
  loadingLawyerSessions = false;

  showSessionDetailDialog = false;
  selectedSessionDetail: any = null;
  loadingSessionDetail = false;

  showActionCaseDialog = false;
  selectedActionCase: any = null;
  loadingActionCase = false;

  portfolioChartData: any;
  caseChartData: any;
  financeChartData: any;
  chartOptions: any;
  doughnutOptions: any;
  private langSub?: Subscription;

  constructor() {
    effect(() => {
      const lang = this.appState.currentLang();
      const currentStats = this.stats();
      if (currentStats) {
        this.initCharts(currentStats);
        this.initChartOptions();
      }
    });

    this.langSub = this.translate.onLangChange.subscribe(() => {
      const currentStats = this.stats();
      if (currentStats) {
        this.initCharts(currentStats);
        this.initChartOptions();
        this.cdr.markForCheck();
      }
    });
  }

  async ngOnInit() {
    await this.loadStats();
    this.initChartOptions();
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
  }

  async loadStats() {
    this.loading.set(true);
    try {
      const data = await this.dashboardService.getStats();
      this.stats.set(data);

      // If user does not have firm-wide view rights but has personal work, default to personal workspace
      if (!data.canViewAllCases && !data.isAdmin && data.myWork) {
        this.currentTab.set('MY_WORK');
      } else {
        this.currentTab.set('OVERVIEW');
      }

      this.initCharts(data);
    } catch (error) {
      console.error('Error loading dashboard stats', error);
    } finally {
      this.loading.set(false);
    }
  }

  get viewModeOptions() {
    const options = [
      { label: this.translate.instant('DASHBOARD.ALL_TIME'), value: 'ALL' }
    ];

    if (this.stats()?.last6MonthsFinance) {
      this.stats()!.last6MonthsFinance.forEach(pt => {
        options.push({ label: pt.month, value: pt.month });
      });
    }

    return options;
  }

  onViewModeChange(mode: string) {
    this.selectedViewMode.set(mode);
    if (this.stats()) {
      this.initCharts(this.stats()!);
    }
  }

  switchTab(tab: 'OVERVIEW' | 'MY_WORK') {
    this.currentTab.set(tab);
  }

  initCharts(data: DashboardStatsDto) {
    const isRtl = this.appState.currentLang() === 'ar';

    // 1. Cases by Status (Doughnut)
    this.caseChartData = {
      labels: data.casesByStatus.map(x => this.translateStatus(x.label)),
      datasets: [
        {
          data: data.casesByStatus.map(x => x.value),
          backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#64748B', '#8B5CF6'],
          hoverBackgroundColor: ['#2563EB', '#D97706', '#059669', '#DC2626', '#475569', '#7C3AED'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    };

    // 2. Legal Portfolio Distribution (Doughnut)
    this.portfolioChartData = {
      labels: data.portfolioDistribution.map(x => this.translatePortfolio(x.label)),
      datasets: [
        {
          data: data.portfolioDistribution.map(x => x.value),
          backgroundColor: ['#2563EB', '#059669', '#7C3AED', '#D97706'],
          hoverBackgroundColor: ['#1D4ED8', '#047857', '#6D28D9', '#B45309'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    };

    // 3. Finance Summary (Bar)
    if (data.canViewFinancials && data.last6MonthsFinance) {
      const mode = this.selectedViewMode();
      let chartPoints = data.last6MonthsFinance;
      if (mode !== 'ALL') {
        chartPoints = data.last6MonthsFinance.filter(x => x.month === mode);
      }

      const financeData = isRtl ? [...chartPoints].reverse() : chartPoints;

      this.financeChartData = {
        labels: financeData.map(x => x.month),
        datasets: [
          {
            label: this.translate.instant('DASHBOARD.INVOICED'),
            backgroundColor: '#3B82F6',
            borderRadius: 6,
            data: financeData.map(x => x.invoiced)
          },
          {
            label: this.translate.instant('DASHBOARD.PAID'),
            backgroundColor: '#10B981',
            borderRadius: 6,
            data: financeData.map(x => x.paid)
          },
          {
            label: this.translate.instant('DASHBOARD.UNCLAIMED'),
            backgroundColor: '#F59E0B',
            borderRadius: 6,
            data: financeData.map(x => Math.max(0, x.invoiced - x.paid))
          }
        ]
      };
    }
  }

  initChartOptions() {
    const isRtl = this.appState.currentLang() === 'ar';
    const font = { family: isRtl ? 'IBM Plex Sans Arabic, sans-serif' : 'Inter, sans-serif' };

    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            font,
            usePointStyle: true,
            boxWidth: 8
          },
          position: 'bottom',
          rtl: isRtl,
          textDirection: isRtl ? 'rtl' : 'ltr'
        },
        tooltip: {
          rtl: isRtl,
          textDirection: isRtl ? 'rtl' : 'ltr',
          titleFont: font,
          bodyFont: font
        }
      },
      scales: {
        x: {
          reverse: isRtl,
          grid: { display: false },
          ticks: { font }
        },
        y: {
          position: isRtl ? 'right' : 'left',
          grid: { color: '#F1F5F9' },
          ticks: { font }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };

    this.doughnutOptions = {
      cutout: '70%',
      plugins: {
        legend: {
          labels: {
            font,
            usePointStyle: true,
            boxWidth: 8
          },
          position: 'bottom',
          rtl: isRtl,
          textDirection: isRtl ? 'rtl' : 'ltr'
        },
        tooltip: {
          rtl: isRtl,
          textDirection: isRtl ? 'rtl' : 'ltr',
          titleFont: font,
          bodyFont: font
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  translateStatus(status: string): string {
    if (!status) return '';
    const upper = status.toUpperCase();
    switch (upper) {
      case 'OPEN':
      case 'INPROGRESS': return this.translate.instant('CASES.IN_PROGRESS');
      case 'PENDING': return this.translate.instant('CASES.PENDING');
      case 'CLOSED': return this.translate.instant('CASES.CLOSED');
      case 'CANCELLED': return this.translate.instant('CASES.CANCELLED');
      case 'SUSPENDED': return this.translate.instant('CASES.SUSPENDED');
      case 'FINISHED': return this.translate.instant('CASES.FINISHED');
      default: return status;
    }
  }

  translatePortfolio(item: string): string {
    if (!item) return '';
    const upper = item.toUpperCase();
    const isAr = this.appState.currentLang() === 'ar' || this.translate.currentLang === 'ar';
    switch (upper) {
      case 'CASES': {
        const val = this.translate.instant('SIDEBAR.CASES');
        return val && val !== 'SIDEBAR.CASES' ? val : (isAr ? 'القضايا' : 'Cases');
      }
      case 'CONTRACTS': {
        const val = this.translate.instant('SIDEBAR.CONTRACTS');
        return val && val !== 'SIDEBAR.CONTRACTS' ? val : (isAr ? 'العقود' : 'Contracts');
      }
      case 'COMPANIES': {
        const val = this.translate.instant('SIDEBAR.COMPANIES');
        return val && val !== 'SIDEBAR.COMPANIES' ? val : (isAr ? 'الشركات' : 'Companies');
      }
      case 'REGISTRATIONS': {
        const val = this.translate.instant('SIDEBAR.REGISTRATIONS');
        return val && val !== 'SIDEBAR.REGISTRATIONS' ? val : (isAr ? 'التسجيلات' : 'Registrations');
      }
      default: return item;
    }
  }

  getDaysUntil(dateStr?: string): number {
    if (!dateStr) return 0;
    const target = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diff;
  }

  getActionSeverity(actionType?: string): 'danger' | 'warn' | 'info' | 'success' | 'secondary' {
    if (!actionType) return 'info';
    const lower = actionType.toLowerCase();
    if (lower.includes('court') || lower.includes('urgent') || lower.includes('deadline')) return 'danger';
    if (lower.includes('follow') || lower.includes('pending') || lower.includes('review')) return 'warn';
    if (lower.includes('done') || lower.includes('completed')) return 'success';
    return 'info';
  }

  getActionLabel(actionType?: string): string {
    if (!actionType) return '';
    const lower = actionType.toLowerCase();
    if (lower.includes('court')) return this.translate.instant('CASES.ACTION_COURT');
    if (lower.includes('office')) return this.translate.instant('CASES.ACTION_OFFICE');
    if (lower.includes('external')) return this.translate.instant('CASES.ACTION_EXTERNAL');
    if (lower.includes('other')) return this.translate.instant('CASES.ACTION_OTHER');
    return actionType;
  }

  // ==========================================
  // Interactive Modals Handlers
  // ==========================================
  async openLawyerSessionsModal(lw: LawyerWorkloadDto) {
    this.selectedLawyer = lw;
    this.showLawyerSessionsDialog = true;
    this.loadingLawyerSessions = true;
    this.cdr.markForCheck();
    try {
      const sessions = await this.sessionService.getSessions({ lawyerId: lw.lawyerId, status: '0' });
      const now = new Date();
      const upcoming = sessions.filter(s => {
        const isScheduled = s.status === SessionStatus.Scheduled || (s.status as any) === 0 || (s.status as any) === '0' || (s.status as any) === 'Scheduled';
        const isFuture = new Date(s.scheduledAt).getTime() >= now.getTime();
        return isScheduled && isFuture;
      });
      upcoming.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      this.lawyerSessions = upcoming;
    } catch (e) {
      const stats = this.stats();
      const now = new Date();
      const local = (stats?.upcomingSessions || [])
        .filter(s => s.assignedLawyerId === lw.lawyerId && new Date(s.scheduledAt).getTime() >= now.getTime());
      this.lawyerSessions = local;
    } finally {
      this.loadingLawyerSessions = false;
      this.cdr.markForCheck();
    }
  }

  async openSessionDetailModal(session: DashboardSessionDto | SessionListDto) {
    this.selectedSessionDetail = { ...session };
    this.showSessionDetailDialog = true;
    this.loadingSessionDetail = true;
    this.cdr.markForCheck();
    try {
      if (session.id) {
        const full = await this.sessionService.getSessionById(session.id);
        if (full) {
          this.selectedSessionDetail = {
            ...session,
            ...full
          };
        }
      }
    } catch (e) {
      // Retain preview
    } finally {
      this.loadingSessionDetail = false;
      this.cdr.markForCheck();
    }
  }

  async openActionCaseModal(actionCase: DashboardActionCaseDto) {
    this.selectedActionCase = { ...actionCase };
    this.showActionCaseDialog = true;
    this.loadingActionCase = true;
    this.cdr.markForCheck();
    try {
      if (actionCase.id) {
        const full = await this.caseService.getCaseById(actionCase.id);
        if (full) {
          this.selectedActionCase = {
            ...actionCase,
            ...full
          };
        }
      }
    } catch (e) {
      // Retain preview
    } finally {
      this.loadingActionCase = false;
      this.cdr.markForCheck();
    }
  }

  navigateToCase(caseId?: string) {
    this.showSessionDetailDialog = false;
    this.showActionCaseDialog = false;
    this.showLawyerSessionsDialog = false;
    if (caseId) {
      this.router.navigate(['/cases'], { queryParams: { id: caseId } });
    } else {
      this.router.navigate(['/cases']);
    }
  }

  navigateToSessions(sessionId?: string, caseId?: string) {
    this.showSessionDetailDialog = false;
    this.showLawyerSessionsDialog = false;
    if (sessionId) {
      this.router.navigate(['/sessions'], { queryParams: { id: sessionId } });
    } else if (caseId) {
      this.router.navigate(['/sessions'], { queryParams: { caseId: caseId } });
    } else {
      this.router.navigate(['/sessions']);
    }
  }
}
