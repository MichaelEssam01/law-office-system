import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { DashboardService, DashboardStatsDto } from '../../../core/services/dashboard.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';

import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ChartModule, ButtonModule, SelectModule, FormsModule, TranslateModule],
  templateUrl: './dashboard-page.html'
})
export class DashboardPage implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private translate = inject(TranslateService);
  private appState = inject(AppStateService);
  
  stats = signal<DashboardStatsDto | null>(null);
  loading = signal(true);
  selectedViewMode = signal<string>('ALL');

  caseChartData: any;
  financeChartData: any;
  chartOptions: any;

  constructor() {
    // React to language changes using effect
    effect(() => {
      const lang = this.appState.currentLang();
      if (this.stats()) {
        this.initCharts(this.stats()!);
        this.initChartOptions();
      }
    });
  }

  async ngOnInit() {
    await this.loadStats();
    this.initChartOptions();
  }

  ngOnDestroy() {
    // No need to manually unsubscribe from effect
  }

  async loadStats() {
    this.loading.set(true);
    try {
      const data = await this.dashboardService.getStats();
      this.stats.set(data);
      this.initCharts(data);
    } catch (error) {
      console.error('Error loading dashboard stats', error);
    } finally {
      this.loading.set(false);
    }
  }

  get viewModeOptions() {
    const isRtl = this.appState.currentLang() === 'ar';
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

  initCharts(data: DashboardStatsDto) {
    // 1. Cases by Status (Pie/Doughnut)
    this.caseChartData = {
      labels: data.casesByStatus.map(x => this.translateStatus(x.label)),
      datasets: [
        {
          data: data.casesByStatus.map(x => x.value),
          backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#64748B'],
          hoverBackgroundColor: ['#2563EB', '#D97706', '#059669', '#DC2626', '#475569']
        }
      ]
    };

    // 2. Finance Summary (Bar)
    const isRtl = this.appState.currentLang() === 'ar';
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
          data: financeData.map(x => x.invoiced)
        },
        {
          label: this.translate.instant('DASHBOARD.PAID'),
          backgroundColor: '#10B981',
          data: financeData.map(x => x.paid)
        },
        {
          label: this.translate.instant('DASHBOARD.UNCLAIMED'),
          backgroundColor: '#F59E0B',
          data: financeData.map(x => Math.max(0, x.invoiced - x.paid))
        }
      ]
    };
  }

  initChartOptions() {
    const isRtl = this.appState.currentLang() === 'ar';
    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            font: { family: isRtl ? 'IBM Plex Sans Arabic, sans-serif' : 'Inter, sans-serif' },
            usePointStyle: true
          },
          position: 'bottom',
          rtl: isRtl,
          textDirection: isRtl ? 'rtl' : 'ltr'
        },
        tooltip: {
          rtl: isRtl,
          textDirection: isRtl ? 'rtl' : 'ltr'
        }
      },
      scales: {
        x: {
          reverse: isRtl,
          ticks: {
            font: { family: isRtl ? 'IBM Plex Sans Arabic, sans-serif' : 'Inter, sans-serif' }
          }
        },
        y: {
          position: isRtl ? 'right' : 'left',
          ticks: {
            font: { family: isRtl ? 'IBM Plex Sans Arabic, sans-serif' : 'Inter, sans-serif' }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'Open': return this.translate.instant('CASES.OPEN');
      case 'Pending': return this.translate.instant('CASES.PENDING');
      case 'Closed': return this.translate.instant('CASES.CLOSED');
      case 'Cancelled': return this.translate.instant('CASES.CANCELLED');
      default: return status;
    }
  }
}
