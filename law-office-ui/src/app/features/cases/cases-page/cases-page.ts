import { Component, OnInit, inject, signal, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
import { CaseService, CaseListDto, CaseStatus, CaseDetailDto } from '../../../core/services/case.service';
import { ClientService, Client } from '../../../core/services/client';
import { CaseDialog } from '../case-dialog/case-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { UserManagementService } from '../../../core/services/user-management.service';

@Component({
  selector: 'app-cases-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule, 
    ButtonModule, 
    InputTextModule, 
    TagModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    ConfirmDialogModule,
    SelectModule,
    CaseDialog,
    TranslateModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './cases-page.html'
})
export class CasesPage implements OnInit {
  private caseService = inject(CaseService);
  private clientService = inject(ClientService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);
  public cdr = inject(ChangeDetectorRef);
  private userService = inject(UserManagementService);

  cases = signal<CaseListDto[]>([]);
  loading = signal(true);
  
  displayDialog = signal(false);
  selectedCase = signal<CaseDetailDto | null>(null);

  // Filters
  searchTerm = signal('');
  selectedStatus = signal<string | null>(null);
  selectedClient = signal<string | null>(null);
  selectedLawyer = signal<string | null>(null);

  statuses = signal<any[]>([]);
  clients = signal<Client[]>([]);
  lawyers = signal<any[]>([]);

  constructor() {
    effect(() => {
      // Trigger update when language changes
      const lang = this.appState.currentLang();
      this.updateStatusLabels();
    });
  }

  updateStatusLabels() {
    this.statuses.set([
      { labelKey: 'CASES.OPEN', value: '0' },
      { labelKey: 'CASES.PENDING', value: '1' },
      { labelKey: 'CASES.CLOSED', value: '2' }
    ]);
  }

  async ngOnInit() {
    this.updateStatusLabels();
    await Promise.all([
      this.loadCases(),
      this.loadFilterData()
    ]);
  }

  async loadFilterData() {
    try {
      this.clients.set(await this.clientService.getClients());
      const allLawyers = await this.userService.getLawyers();
      this.lawyers.set(allLawyers);
    } catch (error) {
      console.error('Error loading filter data', error);
    }
  }

  async loadCases() {
    this.loading.set(true);
    try {
      const filters = {
        status: this.selectedStatus() || undefined,
        clientId: this.selectedClient() || undefined,
        lawyerId: this.selectedLawyer() || undefined
      };
      const data = await this.caseService.getCases(filters);
      this.cases.set(data);
    } catch (error) {
      console.error('Error loading cases', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('CASES.LOAD_ERROR') 
      });
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  async onFilterChange() {
    await this.loadCases();
  }

  async resetFilters() {
    this.searchTerm.set('');
    this.selectedStatus.set(null);
    this.selectedClient.set(null);
    this.selectedLawyer.set(null);
    await this.loadCases();
  }

  openNew() {
    this.selectedCase.set(null);
    this.displayDialog.set(true);
  }

  async editCase(caseItem: CaseListDto) {
    try {
      const fullCase = await this.caseService.getCaseById(caseItem.id);
      this.selectedCase.set(fullCase);
      this.displayDialog.set(true);
    } catch (error) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('CASES.DETAILS_ERROR') 
      });
    }
  }

  deleteCase(caseItem: CaseListDto) {
    this.confirmationService.confirm({
      message: this.translate.instant('CASES.DELETE_CONFIRM_MESSAGE', { caseNumber: caseItem.caseNumber }),
      header: this.translate.instant('CASES.DELETE_CONFIRM_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('CASES.DELETE_ACCEPT'),
      rejectLabel: this.translate.instant('CASES.DELETE_REJECT'),
      accept: async () => {
        try {
          await this.caseService.deleteCase(caseItem.id);
          this.messageService.add({ 
            severity: 'success', 
            summary: this.translate.instant('COMMON.SUCCESS'), 
            detail: this.translate.instant('CASES.DELETE_SUCCESS') 
          });
          await this.loadCases();
        } catch (error) {
          this.messageService.add({ 
            severity: 'error', 
            summary: this.translate.instant('COMMON.ERROR'), 
            detail: this.translate.instant('CASES.DELETE_ERROR') 
          });
        }
      }
    });
  }

  async onSave(caseData: any) {
    try {
      if (caseData.id) {
        await this.caseService.updateCase(caseData.id, caseData);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('CASES.UPDATE_SUCCESS') 
        });
      } else {
        await this.caseService.createCase(caseData);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('CASES.CREATE_SUCCESS') 
        });
      }
      this.displayDialog.set(false);
      await this.loadCases();
    } catch (error) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('CASES.SAVE_ERROR') 
      });
    }
  }

  getStatusSeverity(status: CaseStatus): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case CaseStatus.Open: return 'info';
      case CaseStatus.Pending: return 'warn';
      case CaseStatus.Closed: return 'success';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: CaseStatus): string {
    switch (status) {
      case CaseStatus.Open: return this.translate.instant('CASES.OPEN');
      case CaseStatus.Pending: return this.translate.instant('CASES.PENDING');
      case CaseStatus.Closed: return this.translate.instant('CASES.CLOSED');
      default: return 'Unknown';
    }
  }
}
