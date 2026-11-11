import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { AppStateService } from '../../../core/services/app-state.service';
import { ClientService, Client, ClientWorks } from '../../../core/services/client';
import { DocumentService } from '../../../core/services/document.service';
import { ClientDialog } from '../client-dialog/client-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    ClientDialog,
    TranslateModule,
    IconFieldModule,
    InputIconModule,
    TabsModule,
    TagModule,
    TooltipModule,
    RippleModule
  ],
  templateUrl: './clients-page.html',
  styleUrl: './clients-page.css',
  providers: [MessageService, ConfirmationService]
})
export class ClientsPage implements OnInit {
  @ViewChild('dt') dt?: Table;
  clients: Client[] = [];
  searchTerm: string = '';
  selectedClient: Client | null = null;
  displayDialog: boolean = false;
  loading: boolean = true;

  displayWorksDialog: boolean = false;
  activeWorksTab: string = '0';
  clientWorks: ClientWorks | null = null;
  loadingWorks: boolean = false;
  expandedInvoices: { [key: string]: boolean } = {};

  constructor(
    private clientService: ClientService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public cdr: ChangeDetectorRef,
    private translate: TranslateService,
    public appState: AppStateService,
    private documentService: DocumentService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async openDocument(item: { id: string }) {
    try {
      await this.documentService.openDocument(item.id);
    } catch {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('CASES.DOWNLOAD_ERROR') });
    }
  }

  async downloadDocument(item: { id: string; originalFileName: string }) {
    try {
      await this.documentService.downloadDocument(item.id, item.originalFileName);
    } catch {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('CASES.DOWNLOAD_ERROR') });
    }
  }

  async ngOnInit(): Promise<void> {
    await this.loadClients();
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm = params['search'];
        setTimeout(() => {
          this.dt?.filterGlobal(this.searchTerm, 'contains');
          this.cdr.detectChanges();
        });
      }
    });
  }

  async loadClients() {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      this.clients = await this.clientService.getClients();
    } catch (err) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('CLIENTS.LOAD_ERROR') 
      });
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  openNew() {
    this.selectedClient = null;
    this.displayDialog = true;
  }

  editClient(client: Client) {
    this.selectedClient = { ...client };
    this.displayDialog = true;
  }

  deleteClient(client: Client) {
    this.confirmationService.confirm({
      message: this.translate.instant('CLIENTS.DELETE_CONFIRM_MESSAGE', { name: client.fullName }),
      header: this.translate.instant('CLIENTS.DELETE_CONFIRM_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('COMMON.YES'),
      rejectLabel: this.translate.instant('COMMON.NO'),
      accept: async () => {
        if (client.id) {
          try {
            await this.clientService.deleteClient(client.id);
            this.messageService.add({ 
              severity: 'success', 
              summary: this.translate.instant('COMMON.SUCCESS'), 
              detail: this.translate.instant('CLIENTS.DELETE_SUCCESS') 
            });
            await this.loadClients();
          } catch (err) {
            this.messageService.add({ 
              severity: 'error', 
              summary: this.translate.instant('COMMON.ERROR'), 
              detail: this.translate.instant('CLIENTS.DELETE_ERROR') 
            });
          }
        }
      }
    });
  }

  onDialogHide() {
    this.displayDialog = false;
  }

  private isSaving = false;

  async onSave(client: Client) {
    if (this.isSaving || !this.displayDialog) return;
    this.isSaving = true;
    try {
      if (client.id) {
        await this.clientService.updateClient(client.id, client);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('CLIENTS.UPDATE_SUCCESS') 
        });
      } else {
        await this.clientService.createClient(client);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('CLIENTS.CREATE_SUCCESS') 
        });
      }
      this.displayDialog = false;
      await this.loadClients();
    } catch (err: any) {
      if (err.error && err.error.message === 'NATIONAL_ID_EXISTS') {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translate.instant('COMMON.ERROR'), 
          detail: this.translate.instant('CLIENTS.NATIONAL_ID_EXISTS') 
        });
      } else {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translate.instant('COMMON.ERROR'), 
          detail: this.translate.instant('CLIENTS.SAVE_ERROR') 
        });
      }
    } finally {
      this.isSaving = false;
    }
  }

  viewClientWorks(client: Client) {
    if (!client.id) return;
    this.router.navigate(['/clients', client.id]);
  }

  getCaseStatusLabel(status: string): string {
    const keyMap: { [key: string]: string } = {
      'InProgress': 'CASES.IN_PROGRESS',
      '1': 'CASES.IN_PROGRESS',
      'Open': 'CASES.IN_PROGRESS',
      'Pending': 'CASES.PENDING',
      '2': 'CASES.PENDING',
      'Finished': 'CASES.FINISHED',
      '4': 'CASES.FINISHED',
      'Closed': 'CASES.FINISHED',
      'Suspended': 'CASES.SUSPENDED',
      '5': 'CASES.SUSPENDED',
      'Judgment': 'CASES.JUDGMENT',
      'Appeal': 'CASES.APPEAL',
      'Cancelled': 'CASES.CANCELLED'
    };
    return keyMap[status] ? this.translate.instant(keyMap[status]) : status;
  }

  getContractStatusLabel(status: string): string {
    if (status === 'Finished' || status === '2') return this.translate.instant('CONTRACTS.FINISHED');
    return this.translate.instant('CONTRACTS.IN_DRAFTING');
  }

  getContractTypeLabel(type: string): string {
    const keyMap: { [key: string]: string } = {
      'Lease': 'CONTRACTS.TYPES.LEASE',
      'Sale': 'CONTRACTS.TYPES.SALE',
      'Gift': 'CONTRACTS.TYPES.GIFT',
      'Partnership': 'CONTRACTS.TYPES.PARTNERSHIP',
      'Mortgage': 'CONTRACTS.TYPES.MORTGAGE',
      'Contracting': 'CONTRACTS.TYPES.CONTRACTING',
      'Consulting': 'CONTRACTS.TYPES.CONSULTING',
      'Employment': 'CONTRACTS.TYPES.EMPLOYMENT',
      'Marriage': 'CONTRACTS.TYPES.MARRIAGE',
      'Exploitation': 'CONTRACTS.TYPES.EXPLOITATION',
      'Usufruct': 'CONTRACTS.TYPES.USUFRUCT',
      'Other': 'CONTRACTS.TYPES.OTHER'
    };
    return keyMap[type] ? this.translate.instant(keyMap[type]) : type;
  }

  getRegistrationTypeLabel(type: string): string {
    const keyMap: { [key: string]: string } = {
      'InheritancePublication': 'REGISTRATIONS.REQUEST_TYPES.INHERITANCE_PUBLICATION',
      'BareOwnershipSale': 'REGISTRATIONS.REQUEST_TYPES.BARE_OWNERSHIP_SALE',
      'UsufructSale': 'REGISTRATIONS.REQUEST_TYPES.USUFRUCT_SALE',
      'FullOwnershipSale': 'REGISTRATIONS.REQUEST_TYPES.FULL_OWNERSHIP_SALE',
      'Lease': 'REGISTRATIONS.REQUEST_TYPES.LEASE',
      'Mortgage': 'REGISTRATIONS.REQUEST_TYPES.MORTGAGE',
      'AmicablePartition': 'REGISTRATIONS.REQUEST_TYPES.AMICABLE_PARTITION',
      'PetitionPublication': 'REGISTRATIONS.REQUEST_TYPES.PETITION_PUBLICATION',
      'JudgmentPublication': 'REGISTRATIONS.REQUEST_TYPES.JUDGMENT_PUBLICATION',
      'Other': 'REGISTRATIONS.REQUEST_TYPES.OTHER'
    };
    return keyMap[type] ? this.translate.instant(keyMap[type]) : type;
  }

  getCompanyStatusLabel(status: string): string {
    if (status === 'Finished' || status === '2') return this.translate.instant('COMPANIES.FINISHED');
    return this.translate.instant('COMPANIES.ACTIVE');
  }

  getCompanyTypeLabel(type: string): string {
    const keyMap: { [key: string]: string } = {
      'GeneralPartnership': 'COMPANIES.TYPES.GENERAL_PARTNERSHIP',
      'LimitedPartnership': 'COMPANIES.TYPES.LIMITED_PARTNERSHIP',
      'PartnershipLimitedByShares': 'COMPANIES.TYPES.PARTNERSHIP_LIMITED_BY_SHARES',
      'LimitedLiability': 'COMPANIES.TYPES.LIMITED_LIABILITY',
      'JointStock': 'COMPANIES.TYPES.JOINT_STOCK',
      'DeFacto': 'COMPANIES.TYPES.DE_FACTO',
      'Other': 'COMPANIES.TYPES.OTHER'
    };
    return keyMap[type] ? this.translate.instant(keyMap[type]) : type;
  }

  getCaseStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case 'InProgress':
      case '1':
      case 'Open':
        return 'info';
      case 'Pending':
      case '2':
        return 'warn';
      case 'Finished':
      case '4':
      case 'Closed':
        return 'success';
      case 'Suspended':
      case '5':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getInvoiceStatusLabel(status: string): string {
    const keyMap: { [key: string]: string } = {
      'Unpaid': 'FINANCE.STATUS_LABELS.UNPAID',
      'PartiallyPaid': 'FINANCE.STATUS_LABELS.PARTIAL',
      'Paid': 'FINANCE.STATUS_LABELS.PAID',
      'Overdue': 'FINANCE.STATUS_LABELS.OVERDUE',
      'Cancelled': 'FINANCE.STATUS_LABELS.CANCELLED'
    };
    return keyMap[status] ? this.translate.instant(keyMap[status]) : status;
  }

  getPaymentMethodLabel(method: string): string {
    const keyMap: { [key: string]: string } = {
      'Cash': 'FINANCE.METHODS.CASH',
      'BankTransfer': 'FINANCE.METHODS.BANK',
      'CreditCard': 'FINANCE.METHODS.CARD',
      'Check': 'FINANCE.METHODS.CHEQUE',
      'Cheque': 'FINANCE.METHODS.CHEQUE',
      'Other': 'FINANCE.METHODS.OTHER'
    };
    return keyMap[method] ? this.translate.instant(keyMap[method]) : method;
  }

  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'Cash':
        return 'pi pi-money-bill';
      case 'BankTransfer':
      case 'Bank':
        return 'pi pi-building';
      case 'CreditCard':
      case 'Card':
        return 'pi pi-credit-card';
      case 'Check':
      case 'Cheque':
        return 'pi pi-file-edit';
      default:
        return 'pi pi-wallet';
    }
  }

  getSessionStatusLabel(status: string): string {
    const keyMap: { [key: string]: string } = {
      'Scheduled': 'SESSIONS.SCHEDULED',
      'Completed': 'SESSIONS.COMPLETED',
      'Postponed': 'SESSIONS.POSTPONED',
      'Cancelled': 'SESSIONS.CANCELLED'
    };
    return keyMap[status] ? this.translate.instant(keyMap[status]) : status;
  }

  getDocumentCategoryLabel(category: string): string {
    const keyMap: { [key: string]: string } = {
      'Contract': 'DOCUMENTS.CONTRACT',
      'CourtDocument': 'DOCUMENTS.COURT',
      'Court': 'DOCUMENTS.COURT',
      'Evidence': 'DOCUMENTS.EVIDENCE',
      'Invoice': 'DOCUMENTS.INVOICE',
      'Other': 'DOCUMENTS.OTHER'
    };
    return keyMap[category] ? this.translate.instant(keyMap[category]) : category;
  }

  getAverageRating(client: Client): number {
    const ratings = [
      client.solvencyRating || 0,
      client.commitmentRating || 0,
      client.cooperationRating || 0,
      client.networkRating || 0
    ].filter(r => r > 0);
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((a, b) => a + b, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }

  getPhoneList(phone?: string): string[] {
    if (!phone) return [];
    return phone.split(',').map(p => p.trim()).filter(p => p.length > 0);
  }

  getPoaTypeLabel(poaType?: string): string {
    if (!poaType) return '-';
    switch (poaType) {
      case 'نفسه':
      case 'Self':
        return this.translate.instant('CLIENTS.POA_TYPE_SELF');
      case 'صفة':
      case 'Capacity':
        return this.translate.instant('CLIENTS.POA_TYPE_CAPACITY');
      case 'نفسه وصفة':
      case 'Self & Capacity':
        return this.translate.instant('CLIENTS.POA_TYPE_BOTH');
      default:
        return poaType;
    }
  }

  areAllInvoicesExpanded(): boolean {
    if (!this.clientWorks?.invoices || this.clientWorks.invoices.length === 0) return false;
    return this.clientWorks.invoices.every(inv => inv.id && this.expandedInvoices[inv.id]);
  }

  isAnyInvoiceExpanded(): boolean {
    return Object.values(this.expandedInvoices).some(val => val === true);
  }

  onExpandedInvoicesChange(event: any): void {
    this.expandedInvoices = event || {};
  }

  toggleAllInvoices(): void {
    if (!this.clientWorks?.invoices || this.clientWorks.invoices.length === 0) return;

    if (this.isAnyInvoiceExpanded()) {
      // Close/Collapse all rows
      this.expandedInvoices = {};
    } else {
      // Expand all rows
      const all: { [key: string]: boolean } = {};
      this.clientWorks.invoices.forEach(inv => {
        if (inv.id) all[inv.id] = true;
      });
      this.expandedInvoices = all;
    }
  }
}
