import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { ClientService, Client, ClientWorks } from '../../../core/services/client';
import { DocumentService, DocumentDto } from '../../../core/services/document.service';
import { ClientDialog } from '../client-dialog/client-dialog';

@Component({
  selector: 'app-client-details-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TagModule,
    CardModule,
    TabsModule,
    ToastModule,
    TableModule,
    ConfirmDialogModule,
    TooltipModule,
    ProgressBarModule,
    DialogModule,
    TranslateModule,
    ClientDialog
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './client-details-page.html'
})
export class ClientDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clientService = inject(ClientService);
  private documentService = inject(DocumentService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);

  clientId = signal<string | null>(null);
  clientWorks = signal<ClientWorks | null>(null);
  loading = signal(true);
  isSaving = signal(false);
  activeTab = '0';
  expandedInvoices: { [id: string]: boolean } = {};

  displayEditDialog = signal(false);
  selectedClientForEdit = signal<Client | null>(null);

  async ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.clientId.set(id);
        this.loadClientWorks(id);
      } else {
        this.router.navigate(['/clients']);
      }
    });
  }

  async loadClientWorks(id: string) {
    this.loading.set(true);
    this.cdr.markForCheck();
    try {
      const data = await this.clientService.getClientWorks(id);
      this.clientWorks.set(data);
    } catch (error) {
      console.error('Error loading client works', error);
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('COMMON.ERROR'),
        detail: this.translate.instant('CLIENTS.LOAD_ERROR')
      });
    } finally {
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  editClient() {
    const current = this.clientWorks()?.client;
    if (current) {
      this.selectedClientForEdit.set({ ...current });
      this.displayEditDialog.set(true);
    }
  }

  async onSave(client: Client) {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    try {
      if (client.id) {
        await this.clientService.updateClient(client.id, client);
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('COMMON.SUCCESS'),
          detail: this.translate.instant('CLIENTS.UPDATE_SUCCESS')
        });
        this.displayEditDialog.set(false);
        this.selectedClientForEdit.set(null);
        await this.loadClientWorks(client.id);
      }
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('COMMON.ERROR'),
        detail: this.translate.instant('CLIENTS.UPDATE_ERROR')
      });
    } finally {
      this.isSaving.set(false);
      this.cdr.markForCheck();
    }
  }

  onCancelEdit() {
    this.displayEditDialog.set(false);
    this.selectedClientForEdit.set(null);
  }

  async onClientSaved() {
    this.displayEditDialog.set(false);
    this.selectedClientForEdit.set(null);
    const id = this.clientId();
    if (id) {
      await this.loadClientWorks(id);
    }
  }

  // Helper Methods for formatting & labels
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

  getSessionStatusLabel(status: string): string {
    const keyMap: { [key: string]: string } = {
      'Scheduled': 'SESSIONS.SCHEDULED',
      'Completed': 'SESSIONS.COMPLETED',
      'Postponed': 'SESSIONS.POSTPONED',
      'Cancelled': 'SESSIONS.CANCELLED'
    };
    return keyMap[status] ? this.translate.instant(keyMap[status]) : status;
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

  formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async openDocument(doc: any) {
    try {
      await this.documentService.openDocument(doc.id);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('COMMON.ERROR'),
        detail: this.translate.instant('CASES.DOWNLOAD_ERROR') || 'Failed to open file'
      });
    }
  }

  async downloadDocument(doc: any) {
    try {
      await this.documentService.downloadDocument(doc.id, doc.originalFileName || doc.title || 'document');
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('COMMON.ERROR'),
        detail: this.translate.instant('CASES.DOWNLOAD_ERROR') || 'Download failed'
      });
    }
  }

  areAllInvoicesExpanded(): boolean {
    const invs = this.clientWorks()?.invoices;
    if (!invs || invs.length === 0) return false;
    return invs.every(inv => inv.id && this.expandedInvoices[inv.id]);
  }

  isAnyInvoiceExpanded(): boolean {
    return Object.values(this.expandedInvoices).some(val => val === true);
  }

  onExpandedInvoicesChange(event: any): void {
    this.expandedInvoices = event || {};
  }

  toggleAllInvoices(): void {
    const invs = this.clientWorks()?.invoices;
    if (!invs || invs.length === 0) return;

    if (this.isAnyInvoiceExpanded()) {
      this.expandedInvoices = {};
    } else {
      const all: { [key: string]: boolean } = {};
      invs.forEach(inv => {
        if (inv.id) all[inv.id] = true;
      });
      this.expandedInvoices = all;
    }
  }
}

