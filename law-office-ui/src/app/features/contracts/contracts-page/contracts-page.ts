import { Component, OnInit, inject, signal, computed, ChangeDetectorRef, effect } from '@angular/core';
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
import { ContractService, ContractListDto, ContractDetailDto, ContractStatus, ContractType } from '../../../core/services/contract.service';
import { ClientService, Client } from '../../../core/services/client';
import { ContractDialog } from '../contract-dialog/contract-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { UserManagementService } from '../../../core/services/user-management.service';
import { AutoSelectFilterDirective } from '../../../core/directives/auto-select-filter.directive';

@Component({
  selector: 'app-contracts-page',
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
    ContractDialog,
    TranslateModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './contracts-page.html'
})
export class ContractsPage implements OnInit {
  private contractService = inject(ContractService);
  private clientService = inject(ClientService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);
  public cdr = inject(ChangeDetectorRef);
  private userService = inject(UserManagementService);

  allContracts = signal<ContractListDto[]>([]);
  loading = signal(true);
  displayDialog = signal(false);
  selectedContract = signal<ContractDetailDto | null>(null);

  searchTerm = signal('');
  selectedStatus = signal<number | null>(null);
  selectedContractType = signal<number | null>(null);
  selectedClient = signal<string | null>(null);
  selectedLawyer = signal<string | null>(null);

  totalCount = computed(() => this.allContracts().length);
  inDraftingCount = computed(() => this.allContracts().filter(c => c.status === ContractStatus.InDrafting).length);
  finishedCount = computed(() => this.allContracts().filter(c => c.status === ContractStatus.Finished).length);

  contracts = computed(() => {
    let list = this.allContracts();
    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      list = list.filter(c =>
        c.contractNumber?.toLowerCase().includes(term) ||
        c.title?.toLowerCase().includes(term) ||
        c.clientName?.toLowerCase().includes(term) ||
        c.otherPartyName?.toLowerCase().includes(term) ||
        c.fileNumber?.toLowerCase().includes(term)
      );
    }
    const status = this.selectedStatus();
    if (status !== null && status !== undefined) {
      list = list.filter(c => c.status === Number(status));
    }
    const type = this.selectedContractType();
    if (type !== null && type !== undefined) {
      list = list.filter(c => c.contractType === Number(type));
    }
    return list;
  });

  statuses = signal<any[]>([]);
  contractTypes = signal<any[]>([]);
  clients = signal<Client[]>([]);
  lawyers = signal<any[]>([]);

  constructor() {
    effect(() => {
      const lang = this.appState.currentLang();
      this.updateOptions();
    });
  }

  getStatusCount(value: number): number {
    if (value === ContractStatus.InDrafting) return this.inDraftingCount();
    if (value === ContractStatus.Finished) return this.finishedCount();
    return this.totalCount();
  }

  updateOptions() {
    this.statuses.set([
      { labelKey: 'CONTRACTS.IN_DRAFTING', value: ContractStatus.InDrafting, icon: 'pi pi-file-edit text-sky-600', badgeClass: 'bg-sky-100 text-sky-800' },
      { labelKey: 'CONTRACTS.FINISHED', value: ContractStatus.Finished, icon: 'pi pi-check-circle text-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-800' }
    ]);

    this.contractTypes.set([
      { label: this.translate.instant('CONTRACTS.TYPES.LEASE'), value: ContractType.Lease },
      { label: this.translate.instant('CONTRACTS.TYPES.SALE'), value: ContractType.Sale },
      { label: this.translate.instant('CONTRACTS.TYPES.GIFT'), value: ContractType.Gift },
      { label: this.translate.instant('CONTRACTS.TYPES.PARTNERSHIP'), value: ContractType.Partnership },
      { label: this.translate.instant('CONTRACTS.TYPES.MORTGAGE'), value: ContractType.Mortgage },
      { label: this.translate.instant('CONTRACTS.TYPES.CONTRACTING'), value: ContractType.Contracting },
      { label: this.translate.instant('CONTRACTS.TYPES.CONSULTING'), value: ContractType.Consulting },
      { label: this.translate.instant('CONTRACTS.TYPES.EMPLOYMENT'), value: ContractType.Employment },
      { label: this.translate.instant('CONTRACTS.TYPES.MARRIAGE'), value: ContractType.Marriage },
      { label: this.translate.instant('CONTRACTS.TYPES.EXPLOITATION'), value: ContractType.Exploitation },
      { label: this.translate.instant('CONTRACTS.TYPES.USUFRUCT'), value: ContractType.Usufruct },
      { label: this.translate.instant('CONTRACTS.TYPES.OTHER'), value: ContractType.Other }
    ]);
  }

  async ngOnInit() {
    await Promise.all([this.loadContracts(), this.loadClients(), this.loadLawyers()]);
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

  async loadContracts() {
    this.loading.set(true);
    try {
      const data = await this.contractService.getContracts(
        this.searchTerm(),
        undefined,
        this.selectedClient() || undefined,
        this.selectedLawyer() || undefined
      );
      this.allContracts.set(data);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('CONTRACTS.LOAD_ERROR') });
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange() {
    this.loadContracts();
  }

  resetFilters() {
    this.searchTerm.set('');
    this.selectedStatus.set(null);
    this.selectedContractType.set(null);
    this.selectedClient.set(null);
    this.selectedLawyer.set(null);
    this.loadContracts();
  }

  showAddDialog() {
    this.selectedContract.set(null);
    this.displayDialog.set(true);
  }

  async showEditDialog(item: ContractListDto) {
    try {
      const detail = await this.contractService.getContractById(item.id);
      this.selectedContract.set(detail);
      this.displayDialog.set(true);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('CONTRACTS.LOAD_ERROR') });
    }
  }

  async saveContract(data: any) {
    try {
      if (data.id) {
        await this.contractService.updateContract(data.id, data);
        this.messageService.add({ severity: 'success', summary: this.translate.instant('COMMON.SUCCESS'), detail: this.translate.instant('CONTRACTS.UPDATE_SUCCESS') });
      } else {
        await this.contractService.createContract(data);
        this.messageService.add({ severity: 'success', summary: this.translate.instant('COMMON.SUCCESS'), detail: this.translate.instant('CONTRACTS.CREATE_SUCCESS') });
      }
      this.displayDialog.set(false);
      await this.loadContracts();
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('CONTRACTS.SAVE_ERROR') });
    }
  }

  confirmDelete(item: ContractListDto) {
    this.confirmationService.confirm({
      message: this.translate.instant('CONTRACTS.DELETE_CONFIRM_MESSAGE', { number: item.contractNumber }),
      header: this.translate.instant('CASES.DELETE_CONFIRM_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('CASES.DELETE_ACCEPT'),
      rejectLabel: this.translate.instant('CASES.DELETE_REJECT'),
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: async () => {
        try {
          await this.contractService.deleteContract(item.id);
          this.messageService.add({ severity: 'success', summary: this.translate.instant('COMMON.SUCCESS'), detail: this.translate.instant('CONTRACTS.DELETE_SUCCESS') });
          await this.loadContracts();
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('CONTRACTS.DELETE_ERROR') });
        }
      }
    });
  }

  getStatusSeverity(status: ContractStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return status === ContractStatus.Finished ? 'success' : 'info';
  }

  getStatusLabel(status: ContractStatus): string {
    return status === ContractStatus.Finished ? 'CONTRACTS.FINISHED' : 'CONTRACTS.IN_DRAFTING';
  }

  getContractTypeLabel(type?: ContractType | null, otherText?: string): string {
    if (type === ContractType.Other && otherText) return otherText;
    switch (type) {
      case ContractType.Lease: return 'CONTRACTS.TYPES.LEASE';
      case ContractType.Sale: return 'CONTRACTS.TYPES.SALE';
      case ContractType.Gift: return 'CONTRACTS.TYPES.GIFT';
      case ContractType.Partnership: return 'CONTRACTS.TYPES.PARTNERSHIP';
      case ContractType.Mortgage: return 'CONTRACTS.TYPES.MORTGAGE';
      case ContractType.Contracting: return 'CONTRACTS.TYPES.CONTRACTING';
      case ContractType.Consulting: return 'CONTRACTS.TYPES.CONSULTING';
      case ContractType.Employment: return 'CONTRACTS.TYPES.EMPLOYMENT';
      case ContractType.Marriage: return 'CONTRACTS.TYPES.MARRIAGE';
      case ContractType.Exploitation: return 'CONTRACTS.TYPES.EXPLOITATION';
      case ContractType.Usufruct: return 'CONTRACTS.TYPES.USUFRUCT';
      default: return 'CONTRACTS.TYPES.OTHER';
    }
  }
}
