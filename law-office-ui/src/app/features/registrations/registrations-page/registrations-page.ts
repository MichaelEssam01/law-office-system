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
import { RegistrationService, RegistrationListDto, RegistrationDetailDto, RegistrationRequestType } from '../../../core/services/registration.service';
import { ClientService, Client } from '../../../core/services/client';
import { RegistrationDialog } from '../registration-dialog/registration-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { UserManagementService } from '../../../core/services/user-management.service';
import { AutoSelectFilterDirective } from '../../../core/directives/auto-select-filter.directive';

@Component({
  selector: 'app-registrations-page',
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
    RegistrationDialog,
    TranslateModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './registrations-page.html'
})
export class RegistrationsPage implements OnInit {
  private registrationService = inject(RegistrationService);
  private clientService = inject(ClientService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);
  private userService = inject(UserManagementService);

  allRegistrations = signal<RegistrationListDto[]>([]);
  loading = signal(true);
  displayDialog = signal(false);
  selectedRegistration = signal<RegistrationDetailDto | null>(null);

  searchTerm = signal('');
  selectedRequestType = signal<number | null>(null);
  selectedClient = signal<string | null>(null);
  selectedLawyer = signal<string | null>(null);

  registrations = computed(() => {
    let list = this.allRegistrations();
    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      list = list.filter(r =>
        r.registrationNumber?.toLowerCase().includes(term) ||
        r.authorityName?.toLowerCase().includes(term) ||
        r.clientName?.toLowerCase().includes(term) ||
        r.resultNumber?.toLowerCase().includes(term) ||
        r.fileNumber?.toLowerCase().includes(term)
      );
    }
    const type = this.selectedRequestType();
    if (type !== null && type !== undefined) {
      list = list.filter(r => r.requestType === Number(type));
    }
    return list;
  });

  requestTypes = signal<any[]>([]);
  clients = signal<Client[]>([]);
  lawyers = signal<any[]>([]);

  constructor() {
    effect(() => {
      const lang = this.appState.currentLang();
      this.updateOptions();
    });
  }

  updateOptions() {
    this.requestTypes.set([
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.INHERITANCE_PUBLICATION'), value: RegistrationRequestType.InheritancePublication },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.BARE_OWNERSHIP_SALE'), value: RegistrationRequestType.BareOwnershipSale },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.USUFRUCT_SALE'), value: RegistrationRequestType.UsufructSale },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.FULL_OWNERSHIP_SALE'), value: RegistrationRequestType.FullOwnershipSale },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.LEASE'), value: RegistrationRequestType.Lease },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.MORTGAGE'), value: RegistrationRequestType.Mortgage },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.AMICABLE_PARTITION'), value: RegistrationRequestType.AmicablePartition },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.PETITION_PUBLICATION'), value: RegistrationRequestType.PetitionPublication },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.JUDGMENT_PUBLICATION'), value: RegistrationRequestType.JudgmentPublication },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.OTHER'), value: RegistrationRequestType.Other }
    ]);
  }

  async ngOnInit() {
    await Promise.all([this.loadRegistrations(), this.loadClients(), this.loadLawyers()]);
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

  async loadRegistrations() {
    this.loading.set(true);
    try {
      const data = await this.registrationService.getRegistrations(
        this.searchTerm(),
        undefined,
        this.selectedClient() || undefined,
        this.selectedLawyer() || undefined
      );
      this.allRegistrations.set(data);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('REGISTRATIONS.LOAD_ERROR') });
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange() {
    this.loadRegistrations();
  }

  resetFilters() {
    this.searchTerm.set('');
    this.selectedRequestType.set(null);
    this.selectedClient.set(null);
    this.selectedLawyer.set(null);
    this.loadRegistrations();
  }

  showAddDialog() {
    this.selectedRegistration.set(null);
    this.displayDialog.set(true);
  }

  async showEditDialog(item: RegistrationListDto) {
    try {
      const detail = await this.registrationService.getRegistrationById(item.id);
      this.selectedRegistration.set(detail);
      this.displayDialog.set(true);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('REGISTRATIONS.LOAD_ERROR') });
    }
  }

  async saveRegistration(data: any) {
    try {
      if (data.id) {
        await this.registrationService.updateRegistration(data.id, data);
        this.messageService.add({ severity: 'success', summary: this.translate.instant('COMMON.SUCCESS'), detail: this.translate.instant('REGISTRATIONS.UPDATE_SUCCESS') });
      } else {
        await this.registrationService.createRegistration(data);
        this.messageService.add({ severity: 'success', summary: this.translate.instant('COMMON.SUCCESS'), detail: this.translate.instant('REGISTRATIONS.CREATE_SUCCESS') });
      }
      this.displayDialog.set(false);
      await this.loadRegistrations();
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('REGISTRATIONS.SAVE_ERROR') });
    }
  }

  confirmDelete(item: RegistrationListDto) {
    this.confirmationService.confirm({
      message: this.translate.instant('REGISTRATIONS.DELETE_CONFIRM_MESSAGE', { number: item.registrationNumber }),
      header: this.translate.instant('CASES.DELETE_CONFIRM_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('CASES.DELETE_ACCEPT'),
      rejectLabel: this.translate.instant('CASES.DELETE_REJECT'),
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: async () => {
        try {
          await this.registrationService.deleteRegistration(item.id);
          this.messageService.add({ severity: 'success', summary: this.translate.instant('COMMON.SUCCESS'), detail: this.translate.instant('REGISTRATIONS.DELETE_SUCCESS') });
          await this.loadRegistrations();
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('REGISTRATIONS.DELETE_ERROR') });
        }
      }
    });
  }

  getRequestTypeLabel(type?: RegistrationRequestType | null, otherText?: string): string {
    if (type === RegistrationRequestType.Other && otherText) return otherText;
    switch (type) {
      case RegistrationRequestType.InheritancePublication: return 'REGISTRATIONS.REQUEST_TYPES.INHERITANCE_PUBLICATION';
      case RegistrationRequestType.BareOwnershipSale: return 'REGISTRATIONS.REQUEST_TYPES.BARE_OWNERSHIP_SALE';
      case RegistrationRequestType.UsufructSale: return 'REGISTRATIONS.REQUEST_TYPES.USUFRUCT_SALE';
      case RegistrationRequestType.FullOwnershipSale: return 'REGISTRATIONS.REQUEST_TYPES.FULL_OWNERSHIP_SALE';
      case RegistrationRequestType.Lease: return 'REGISTRATIONS.REQUEST_TYPES.LEASE';
      case RegistrationRequestType.Mortgage: return 'REGISTRATIONS.REQUEST_TYPES.MORTGAGE';
      case RegistrationRequestType.AmicablePartition: return 'REGISTRATIONS.REQUEST_TYPES.AMICABLE_PARTITION';
      case RegistrationRequestType.PetitionPublication: return 'REGISTRATIONS.REQUEST_TYPES.PETITION_PUBLICATION';
      case RegistrationRequestType.JudgmentPublication: return 'REGISTRATIONS.REQUEST_TYPES.JUDGMENT_PUBLICATION';
      default: return 'REGISTRATIONS.REQUEST_TYPES.OTHER';
    }
  }
}
