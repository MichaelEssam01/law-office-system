import { Component, OnInit, inject, signal, computed, ChangeDetectorRef, effect } from '@angular/core';
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
import { CaseService, CaseListDto, CaseStatus, CaseDetailDto, CaseType, FamilyCaseSubtype, LitigationDegree, ArchivingType } from '../../../core/services/case.service';
import { ClientService, Client } from '../../../core/services/client';
import { CaseDialog } from '../case-dialog/case-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { UserManagementService } from '../../../core/services/user-management.service';

import { AutoSelectFilterDirective } from '../../../core/directives/auto-select-filter.directive';
import { SuspensionReasonPipe } from '../../../core/pipes/suspension-reason.pipe';

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
    AutoSelectFilterDirective,
    CaseDialog,
    SuspensionReasonPipe,
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

  allCases = signal<CaseListDto[]>([]);
  loading = signal(true);
  
  displayDialog = signal(false);
  selectedCase = signal<CaseDetailDto | null>(null);

  // Filters
  searchTerm = signal('');
  selectedStatus = signal<string | null>(null);
  selectedCaseType = signal<number | null>(null);
  selectedClient = signal<string | null>(null);
  selectedLawyer = signal<string | null>(null);

  totalCount = computed(() => this.allCases().length);
  inProgressCount = computed(() => this.allCases().filter(c => c.status === CaseStatus.InProgress).length);
  pendingCount = computed(() => this.allCases().filter(c => c.status === CaseStatus.Pending).length);
  suspendedCount = computed(() => this.allCases().filter(c => c.status === CaseStatus.Suspended).length);
  finishedCount = computed(() => this.allCases().filter(c => c.status === CaseStatus.Finished).length);

  cases = computed(() => {
    let list = this.allCases();
    const status = this.selectedStatus();
    if (status !== null && status !== undefined && status !== '') {
      const statusNum = Number(status);
      list = list.filter(c => c.status === statusNum);
    }
    const type = this.selectedCaseType();
    if (type !== null && type !== undefined) {
      list = list.filter(c => c.caseType === type);
    }
    return list;
  });

  getStatusCount(value: string): number {
    switch (value) {
      case '1': return this.inProgressCount();
      case '2': return this.pendingCount();
      case '4': return this.finishedCount();
      case '5': return this.suspendedCount();
      default: return this.totalCount();
    }
  }

  statuses = signal<any[]>([]);
  caseTypes = signal<any[]>([]);
  clients = signal<Client[]>([]);
  lawyers = signal<any[]>([]);

  constructor() {
    effect(() => {
      // Trigger update when language changes
      const lang = this.appState.currentLang();
      this.updateStatusLabels();
      this.updateCaseTypeOptions();
    });
  }

  updateStatusLabels() {
    this.statuses.set([
      { labelKey: 'CASES.IN_PROGRESS', value: '1', icon: 'pi pi-cog text-sky-600', badgeClass: 'bg-sky-100 text-sky-800' },
      { labelKey: 'CASES.PENDING', value: '2', icon: 'pi pi-clock text-amber-600', badgeClass: 'bg-amber-100 text-amber-800' },
      { labelKey: 'CASES.SUSPENDED', value: '5', icon: 'pi pi-pause-circle text-rose-600', badgeClass: 'bg-rose-100 text-rose-800' },
      { labelKey: 'CASES.FINISHED', value: '4', icon: 'pi pi-check-circle text-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-800' }
    ]);
  }

  updateCaseTypeOptions() {
    this.caseTypes.set([
      { label: this.translate.instant('CASES.CASE_TYPES.ADMINISTRATIVE'), value: CaseType.Administrative },
      { label: this.translate.instant('CASES.CASE_TYPES.FAMILY'), value: CaseType.Family },
      { label: this.translate.instant('CASES.CASE_TYPES.ECONOMIC'), value: CaseType.Economic },
      { label: this.translate.instant('CASES.CASE_TYPES.RENTS'), value: CaseType.Rents },
      { label: this.translate.instant('CASES.CASE_TYPES.CONSTITUTIONAL'), value: CaseType.Constitutional },
      { label: this.translate.instant('CASES.CASE_TYPES.COMMERCIAL'), value: CaseType.Commercial },
      { label: this.translate.instant('CASES.CASE_TYPES.COMPENSATION'), value: CaseType.Compensation },
      { label: this.translate.instant('CASES.CASE_TYPES.ENFORCEMENT'), value: CaseType.Enforcement },
      { label: this.translate.instant('CASES.CASE_TYPES.SIGNATURE_VALIDITY'), value: CaseType.SignatureValidity },
      { label: this.translate.instant('CASES.CASE_TYPES.LABOR'), value: CaseType.Labor },
      { label: this.translate.instant('CASES.CASE_TYPES.CIVIL'), value: CaseType.Civil },
      { label: this.translate.instant('CASES.CASE_TYPES.CIVIL_APPEALED'), value: CaseType.CivilAppealed },
      { label: this.translate.instant('CASES.CASE_TYPES.URGENT'), value: CaseType.Urgent },
      { label: this.translate.instant('CASES.CASE_TYPES.CRIMINAL'), value: CaseType.Criminal },
      { label: this.translate.instant('CASES.CASE_TYPES.OTHER'), value: CaseType.Other }
    ]);
  }

  async ngOnInit() {
    this.updateStatusLabels();
    this.updateCaseTypeOptions();
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
        clientId: this.selectedClient() || undefined,
        lawyerId: this.selectedLawyer() || undefined
      };
      const data = await this.caseService.getCases(filters);
      this.allCases.set(data);
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
    this.selectedCaseType.set(null);
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

  private isSaving = false;

  async onSave(caseData: any) {
    if (this.isSaving || !this.displayDialog()) return;
    this.isSaving = true;
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
    } finally {
      this.isSaving = false;
    }
  }

  getStatusSeverity(status: CaseStatus): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case CaseStatus.InProgress: return 'info';
      case CaseStatus.Pending: return 'warn';
      case CaseStatus.Finished: return 'success';
      case CaseStatus.Suspended: return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: CaseStatus): string {
    switch (status) {
      case CaseStatus.InProgress: return this.translate.instant('CASES.IN_PROGRESS');
      case CaseStatus.Pending: return this.translate.instant('CASES.PENDING');
      case CaseStatus.Finished: return this.translate.instant('CASES.FINISHED');
      case CaseStatus.Suspended: return this.translate.instant('CASES.SUSPENDED');
      default: return 'Unknown';
    }
  }

  getCaseTypeKey(type?: CaseType | null): string {
    if (type === null || type === undefined) return '';
    const map: Record<CaseType, string> = {
      [CaseType.Administrative]: 'CASES.CASE_TYPES.ADMINISTRATIVE',
      [CaseType.Family]: 'CASES.CASE_TYPES.FAMILY',
      [CaseType.Economic]: 'CASES.CASE_TYPES.ECONOMIC',
      [CaseType.Rents]: 'CASES.CASE_TYPES.RENTS',
      [CaseType.Constitutional]: 'CASES.CASE_TYPES.CONSTITUTIONAL',
      [CaseType.Commercial]: 'CASES.CASE_TYPES.COMMERCIAL',
      [CaseType.Compensation]: 'CASES.CASE_TYPES.COMPENSATION',
      [CaseType.Enforcement]: 'CASES.CASE_TYPES.ENFORCEMENT',
      [CaseType.SignatureValidity]: 'CASES.CASE_TYPES.SIGNATURE_VALIDITY',
      [CaseType.Labor]: 'CASES.CASE_TYPES.LABOR',
      [CaseType.Civil]: 'CASES.CASE_TYPES.CIVIL',
      [CaseType.CivilAppealed]: 'CASES.CASE_TYPES.CIVIL_APPEALED',
      [CaseType.Urgent]: 'CASES.CASE_TYPES.URGENT',
      [CaseType.Criminal]: 'CASES.CASE_TYPES.CRIMINAL',
      [CaseType.Other]: 'CASES.CASE_TYPES.OTHER'
    };
    return map[type] || '';
  }

  getLitigationDegreeKey(deg?: LitigationDegree | null): string {
    if (deg === null || deg === undefined) return '';
    const map: Record<LitigationDegree, string> = {
      [LitigationDegree.Summary]: 'CASES.LITIGATION_DEGREES.SUMMARY',
      [LitigationDegree.FirstInstance]: 'CASES.LITIGATION_DEGREES.FIRST_INSTANCE',
      [LitigationDegree.AdministrativeCourt]: 'CASES.LITIGATION_DEGREES.ADMINISTRATIVE_COURT',
      [LitigationDegree.StateCouncil]: 'CASES.LITIGATION_DEGREES.STATE_COUNCIL',
      [LitigationDegree.Appellate]: 'CASES.LITIGATION_DEGREES.APPELLATE',
      [LitigationDegree.Cassation]: 'CASES.LITIGATION_DEGREES.CASSATION',
      [LitigationDegree.Constitutional]: 'CASES.LITIGATION_DEGREES.CONSTITUTIONAL',
      [LitigationDegree.Supreme]: 'CASES.LITIGATION_DEGREES.SUPREME',
      [LitigationDegree.Other]: 'CASES.LITIGATION_DEGREES.OTHER'
    };
    return map[deg] || '';
  }

  getArchivingTypeKey(type?: ArchivingType | null): string {
    if (type === null || type === undefined) return '';
    const map: Record<ArchivingType, string> = {
      [ArchivingType.Permanent]: 'CASES.ARCHIVE_PERMANENT',
      [ArchivingType.Temporary]: 'CASES.ARCHIVE_TEMPORARY',
      [ArchivingType.Disposed]: 'CASES.ARCHIVE_DISPOSED'
    };
    return map[type] || '';
  }

  getFamilySubtypeKey(sub?: FamilyCaseSubtype | null): string {
    if (sub === null || sub === undefined) return '';
    const map: Record<FamilyCaseSubtype, string> = {
      [FamilyCaseSubtype.Financial]: 'CASES.FAMILY_SUBTYPES.FINANCIAL',
      [FamilyCaseSubtype.Miscellaneous]: 'CASES.FAMILY_SUBTYPES.MISCELLANEOUS',
      [FamilyCaseSubtype.Imprisonment]: 'CASES.FAMILY_SUBTYPES.IMPRISONMENT',
      [FamilyCaseSubtype.Inheritance]: 'CASES.FAMILY_SUBTYPES.INHERITANCE'
    };
    return map[sub] || '';
  }
}
