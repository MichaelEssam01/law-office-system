import { Component, OnInit, inject, signal, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SessionService, SessionListDto, SessionStatus, SessionDetailDto } from '../../../core/services/session.service';
import { CaseService, CaseListDto } from '../../../core/services/case.service';
import { SessionDialog } from '../session-dialog/session-dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';

@Component({
  selector: 'app-sessions-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    ConfirmDialogModule,
    SelectModule,
    TooltipModule,
    SessionDialog,
    TranslateModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './sessions-page.html'
})
export class SessionsPage implements OnInit {
  private sessionService = inject(SessionService);
  private caseService = inject(CaseService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);
  private cdr = inject(ChangeDetectorRef);

  sessions = signal<SessionListDto[]>([]);
  loading = signal(true);
  
  displayDialog = signal(false);
  selectedSession = signal<SessionDetailDto | null>(null);

  // Filters
  searchTerm = signal('');
  selectedStatus = signal<string | null>(null);
  selectedCase = signal<string | null>(null);
  
  cases = signal<CaseListDto[]>([]);
  statuses = signal<any[]>([]);

  constructor() {
    effect(() => {
      // Trigger update when language changes
      const lang = this.appState.currentLang();
      this.updateStatusLabels();
    });
  }

  updateStatusLabels() {
    this.statuses.set([
      { label: this.translate.instant('SESSIONS.SCHEDULED'), value: '0' },
      { label: this.translate.instant('SESSIONS.COMPLETED'), value: '1' },
      { label: this.translate.instant('SESSIONS.POSTPONED'), value: '2' },
      { label: this.translate.instant('SESSIONS.CANCELLED'), value: '3' }
    ]);
  }

  async ngOnInit() {
    this.updateStatusLabels();
    await Promise.all([
      this.loadSessions(),
      this.loadCases()
    ]);
  }

  async loadCases() {
    try {
      this.cases.set(await this.caseService.getCases());
    } catch (error) {
      console.error('Error loading cases for filters', error);
    }
  }

  async loadSessions() {
    this.loading.set(true);
    try {
      const filters = {
        status: this.selectedStatus() || undefined,
        caseId: this.selectedCase() || undefined
      };
      const data = await this.sessionService.getSessions(filters);
      this.sessions.set(data);
    } catch (error) {
      console.error('Error loading sessions', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('SESSIONS.LOAD_ERROR') 
      });
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  async onFilterChange() {
    await this.loadSessions();
  }

  async resetFilters() {
    this.searchTerm.set('');
    this.selectedStatus.set(null);
    this.selectedCase.set(null);
    await this.loadSessions();
  }

  openNew() {
    this.selectedSession.set(null);
    this.displayDialog.set(true);
  }

  async editSession(sessionItem: SessionListDto) {
    try {
      const fullSession = await this.sessionService.getSessionById(sessionItem.id);
      this.selectedSession.set(fullSession);
      this.displayDialog.set(true);
    } catch (error) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('SESSIONS.DETAILS_ERROR') 
      });
    }
  }

  deleteSession(sessionItem: SessionListDto) {
    this.confirmationService.confirm({
      message: this.translate.instant('SESSIONS.DELETE_CONFIRM', { title: sessionItem.title }),
      header: this.translate.instant('COMMON.CONFIRM'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('COMMON.YES'),
      rejectLabel: this.translate.instant('COMMON.CANCEL'),
      accept: async () => {
        try {
          await this.sessionService.deleteSession(sessionItem.id);
          this.messageService.add({ 
            severity: 'success', 
            summary: this.translate.instant('COMMON.SUCCESS'), 
            detail: this.translate.instant('SESSIONS.DELETE_SUCCESS') 
          });
          await this.loadSessions();
        } catch (error) {
          this.messageService.add({ 
            severity: 'error', 
            summary: this.translate.instant('COMMON.ERROR'), 
            detail: this.translate.instant('SESSIONS.DELETE_ERROR') 
          });
        }
      }
    });
  }

  async onSave(sessionData: any) {
    try {
      if (sessionData.id) {
        await this.sessionService.updateSession(sessionData.id, sessionData);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('SESSIONS.UPDATE_SUCCESS') 
        });
      } else {
        await this.sessionService.createSession(sessionData);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('SESSIONS.CREATE_SUCCESS') 
        });
      }
      this.displayDialog.set(false);
      await this.loadSessions();
    } catch (error) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('SESSIONS.SAVE_ERROR') 
      });
    }
  }

  getStatusSeverity(status: SessionStatus): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case SessionStatus.Scheduled: return 'info';
      case SessionStatus.Completed: return 'success';
      case SessionStatus.Postponed: return 'warn';
      case SessionStatus.Cancelled: return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: SessionStatus): string {
    switch (status) {
      case SessionStatus.Scheduled: return this.translate.instant('SESSIONS.SCHEDULED');
      case SessionStatus.Completed: return this.translate.instant('SESSIONS.COMPLETED');
      case SessionStatus.Postponed: return this.translate.instant('SESSIONS.POSTPONED');
      case SessionStatus.Cancelled: return this.translate.instant('SESSIONS.CANCELLED');
      default: return 'Unknown';
    }
  }
}
