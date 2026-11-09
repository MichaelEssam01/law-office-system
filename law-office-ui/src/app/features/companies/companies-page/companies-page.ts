import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { CompanyService, CompanyListDto, CompanyDetailDto, CompanyStatus, CompanyType } from '../../../core/services/company.service';
import { ClientService, Client } from '../../../core/services/client';
import { CompanyDialog } from '../company-dialog/company-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { UserManagementService } from '../../../core/services/user-management.service';
import { AutoSelectFilterDirective } from '../../../core/directives/auto-select-filter.directive';

@Component({
  selector: 'app-companies-page',
  standalone: true,
  imports: [
    CommonModule,
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
    AutoSelectFilterDirective,
    CompanyDialog,
    TranslateModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './companies-page.html'
})
export class CompaniesPage implements OnInit {
  private companyService = inject(CompanyService);
  private clientService = inject(ClientService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);
  private userService = inject(UserManagementService);

  allCompanies = signal<CompanyListDto[]>([]);
  loading = signal(true);
  displayDialog = signal(false);
  selectedCompany = signal<CompanyDetailDto | null>(null);

  searchTerm = signal('');
  selectedStatus = signal<number | null>(null);
  selectedCompanyType = signal<number | null>(null);
  selectedClient = signal<string | null>(null);
  selectedLawyer = signal<string | null>(null);

  totalCount = computed(() => this.allCompanies().length);
  activeCount = computed(() => this.allCompanies().filter(c => c.status === CompanyStatus.Active).length);
  finishedCount = computed(() => this.allCompanies().filter(c => c.status === CompanyStatus.Finished).length);

  companies = computed(() => {
    let list = this.allCompanies();
    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      list = list.filter(c =>
        c.companyCode?.toLowerCase().includes(term) ||
        c.title?.toLowerCase().includes(term) ||
        c.companyNumber?.toLowerCase().includes(term) ||
        c.clientName?.toLowerCase().includes(term) ||
        c.fileNumber?.toLowerCase().includes(term)
      );
    }
    const status = this.selectedStatus();
    if (status !== null && status !== undefined) {
      list = list.filter(c => c.status === Number(status));
    }
    const type = this.selectedCompanyType();
    if (type !== null && type !== undefined) {
      list = list.filter(c => c.companyType === Number(type));
    }
    return list;
  });

  statuses = signal<any[]>([]);
  companyTypes = signal<any[]>([]);
  clients = signal<Client[]>([]);
  lawyers = signal<any[]>([]);

  constructor() {
    effect(() => {
      const lang = this.appState.currentLang();
      this.updateOptions();
    });
  }

  getStatusCount(value: number): number {
    if (value === CompanyStatus.Active) return this.activeCount();
    if (value === CompanyStatus.Finished) return this.finishedCount();
    return this.totalCount();
  }

  updateOptions() {
    this.statuses.set([
      { labelKey: 'COMPANIES.ACTIVE', value: CompanyStatus.Active, icon: 'pi pi-building text-sky-600', badgeClass: 'bg-sky-100 text-sky-800' },
      { labelKey: 'COMPANIES.FINISHED', value: CompanyStatus.Finished, icon: 'pi pi-check-circle text-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-800' }
    ]);

    this.companyTypes.set([
      { label: this.translate.instant('COMPANIES.TYPES.GENERAL_PARTNERSHIP'), value: CompanyType.GeneralPartnership },
      { label: this.translate.instant('COMPANIES.TYPES.LIMITED_PARTNERSHIP'), value: CompanyType.LimitedPartnership },
      { label: this.translate.instant('COMPANIES.TYPES.PARTNERSHIP_LIMITED_BY_SHARES'), value: CompanyType.PartnershipLimitedByShares },
      { label: this.translate.instant('COMPANIES.TYPES.LIMITED_LIABILITY'), value: CompanyType.LimitedLiability },
      { label: this.translate.instant('COMPANIES.TYPES.JOINT_STOCK'), value: CompanyType.JointStock },
      { label: this.translate.instant('COMPANIES.TYPES.DE_FACTO'), value: CompanyType.DeFacto },
      { label: this.translate.instant('COMPANIES.TYPES.OTHER'), value: CompanyType.Other }
    ]);
  }

  async ngOnInit() {
    await Promise.all([this.loadCompanies(), this.loadClients(), this.loadLawyers()]);
  }

  async loadClients() {
    try {
      this.clients.set(await this.clientService.getClients());
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }

  async loadLawyers() {
    try {
      const users = await this.userService.getUsers();
      this.lawyers.set(users.filter(u => u.role === 'Lawyer' || u.role === 'Admin'));
    } catch (error) {
      console.error('Error loading lawyers:', error);
    }
  }

  async loadCompanies() {
    this.loading.set(true);
    try {
      const data = await this.companyService.getCompanies(
        this.searchTerm(),
        undefined,
        this.selectedClient() || undefined,
        this.selectedLawyer() || undefined
      );
      this.allCompanies.set(data);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('COMPANIES.LOAD_ERROR') });
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange() {
    this.loadCompanies();
  }

  resetFilters() {
    this.searchTerm.set('');
    this.selectedStatus.set(null);
    this.selectedCompanyType.set(null);
    this.selectedClient.set(null);
    this.selectedLawyer.set(null);
    this.loadCompanies();
  }

  showAddDialog() {
    this.selectedCompany.set(null);
    this.displayDialog.set(true);
  }

  async showEditDialog(item: CompanyListDto) {
    try {
      const detail = await this.companyService.getCompanyById(item.id);
      this.selectedCompany.set(detail);
      this.displayDialog.set(true);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('COMPANIES.LOAD_ERROR') });
    }
  }

  async saveCompany(data: any) {
    try {
      if (data.id) {
        await this.companyService.updateCompany(data.id, data);
        this.messageService.add({ severity: 'success', summary: this.translate.instant('COMMON.SUCCESS'), detail: this.translate.instant('COMPANIES.UPDATE_SUCCESS') });
      } else {
        await this.companyService.createCompany(data);
        this.messageService.add({ severity: 'success', summary: this.translate.instant('COMMON.SUCCESS'), detail: this.translate.instant('COMPANIES.CREATE_SUCCESS') });
      }
      this.displayDialog.set(false);
      await this.loadCompanies();
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('COMPANIES.SAVE_ERROR') });
    }
  }

  confirmDelete(item: CompanyListDto) {
    this.confirmationService.confirm({
      message: this.translate.instant('COMPANIES.DELETE_CONFIRM_MESSAGE', { number: item.companyCode }),
      header: this.translate.instant('CASES.DELETE_CONFIRM_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('CASES.DELETE_ACCEPT'),
      rejectLabel: this.translate.instant('CASES.DELETE_REJECT'),
      acceptButtonclass: 'p-button-danger p-button-sm',
      rejectButtonclass: 'p-button-text p-button-secondary p-button-sm',
      accept: async () => {
        try {
          await this.companyService.deleteCompany(item.id);
          this.messageService.add({ severity: 'success', summary: this.translate.instant('COMMON.SUCCESS'), detail: this.translate.instant('COMPANIES.DELETE_SUCCESS') });
          await this.loadCompanies();
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('COMPANIES.DELETE_ERROR') });
        }
      }
    });
  }

  getStatusSeverity(status: CompanyStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return status === CompanyStatus.Finished ? 'success' : 'info';
  }

  getStatusLabel(status: CompanyStatus): string {
    return status === CompanyStatus.Finished ? 'COMPANIES.FINISHED' : 'COMPANIES.ACTIVE';
  }

  getCompanyTypeLabel(type?: CompanyType | null, otherText?: string): string {
    if (type === CompanyType.Other && otherText) return otherText;
    switch (type) {
      case CompanyType.GeneralPartnership: return 'COMPANIES.TYPES.GENERAL_PARTNERSHIP';
      case CompanyType.LimitedPartnership: return 'COMPANIES.TYPES.LIMITED_PARTNERSHIP';
      case CompanyType.PartnershipLimitedByShares: return 'COMPANIES.TYPES.PARTNERSHIP_LIMITED_BY_SHARES';
      case CompanyType.LimitedLiability: return 'COMPANIES.TYPES.LIMITED_LIABILITY';
      case CompanyType.JointStock: return 'COMPANIES.TYPES.JOINT_STOCK';
      case CompanyType.DeFacto: return 'COMPANIES.TYPES.DE_FACTO';
      default: return 'COMPANIES.TYPES.OTHER';
    }
  }
}
