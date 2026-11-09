import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Table, TableModule } from 'primeng/table';
import { ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { PopoverModule } from 'primeng/popover';
import { CheckboxModule } from 'primeng/checkbox';
import { FinanceService, InvoiceListDto, FinancialSummaryDto, InvoiceStatus, FinanceCategory } from '../../../core/services/finance.service';
import { InvoiceDialog } from '../invoice-dialog/invoice-dialog';
import { PaymentDialog } from '../payment-dialog/payment-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';

@Component({
  selector: 'app-finance-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardModule,
    ToastModule,
    TooltipModule,
    PopoverModule,
    CheckboxModule,
    InvoiceDialog,
    PaymentDialog,
    TranslateModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService],
  templateUrl: './finance-page.html'
})
export class FinancePage implements OnInit {
  private financeService = inject(FinanceService);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);
  public cdr = inject(ChangeDetectorRef);
  public appState = inject(AppStateService);
  @ViewChild('dt') dt?: Table;

  summary = signal<FinancialSummaryDto | null>(null);
  invoices = signal<any[]>([]);
  loading = signal(true);
  selectedStatuses = signal<number[]>([]);
  activeTab = signal<'all' | 'fees' | 'expenses'>('all');
  defaultInvoiceCategory = signal<FinanceCategory>(FinanceCategory.Fees);

  feesCount = computed(() => this.invoices().filter(i => (i.category ?? FinanceCategory.Fees) === FinanceCategory.Fees).length);
  expensesCount = computed(() => this.invoices().filter(i => i.category === FinanceCategory.Expenses).length);

  filteredInvoices = computed(() => {
    const all = this.invoices();
    const tab = this.activeTab();
    if (tab === 'fees') {
      return all.filter(i => (i.category ?? FinanceCategory.Fees) === FinanceCategory.Fees);
    }
    if (tab === 'expenses') {
      return all.filter(i => i.category === FinanceCategory.Expenses);
    }
    return all;
  });

  displayedSummary = computed(() => {
    const tab = this.activeTab();
    const all = this.invoices();
    const filtered = tab === 'fees'
      ? all.filter(i => (i.category ?? FinanceCategory.Fees) === FinanceCategory.Fees)
      : tab === 'expenses'
      ? all.filter(i => i.category === FinanceCategory.Expenses)
      : all;

    const totalInvoiced = filtered.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalPaid = filtered.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const totalRemaining = filtered.reduce((sum, i) => sum + (i.remainingAmount || 0), 0);
    const totalCancelled = filtered.filter(i => i.status === InvoiceStatus.Cancelled).reduce((sum, i) => sum + (i.remainingAmount || 0), 0);
    const overdueCount = filtered.filter(i => i.status === InvoiceStatus.Overdue).length;

    return {
      totalInvoiced,
      totalPaid,
      totalRemaining,
      totalCancelled,
      overdueInvoicesCount: overdueCount
    };
  });

  statuses = [
    { label: 'FINANCE.UNPAID', value: InvoiceStatus.Unpaid, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'FINANCE.PARTIAL', value: InvoiceStatus.PartiallyPaid, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'FINANCE.PAID', value: InvoiceStatus.Paid, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'FINANCE.OVERDUE', value: InvoiceStatus.Overdue, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { label: 'CASES.CANCELLED', value: InvoiceStatus.Cancelled, color: 'text-slate-600 bg-slate-50 border-slate-200' }
  ];

  toggleStatusFilter(statusValue: number) {
    const current = [...this.selectedStatuses()];
    const index = current.indexOf(statusValue);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(statusValue);
    }
    this.selectedStatuses.set(current);
    this.applyStatusFilter();
  }

  clearStatusFilters() {
    this.selectedStatuses.set([]);
    this.applyStatusFilter();
  }

  private applyStatusFilter() {
    if (this.dt) {
      const selected = this.selectedStatuses();
      if (selected.length === 0) {
        this.dt.filter(null, 'status', 'in');
      } else {
        this.dt.filter(selected, 'status', 'in');
      }
    }
  }

  // Dialogs
  displayInvoiceDialog = signal(false);
  displayPaymentDialog = signal(false);
  selectedInvoice = signal<InvoiceListDto | null>(null);

  async ngOnInit() {
    await this.loadData();
  }

  async loadData(refreshInvoiceId?: string) {
    this.loading.set(true);
    try {
      const previouslyExpandedIds = new Set<string>(
        this.invoices()
          .filter(item => this.dt?.isRowExpanded(item) || item.id === refreshInvoiceId)
          .map(item => item.id)
      );

      const [summaryData, invoicesData] = await Promise.all([
        this.financeService.getGlobalSummary(),
        this.financeService.getInvoices()
      ]);

      if (previouslyExpandedIds.size > 0) {
        await Promise.all(
          invoicesData
            .filter(item => previouslyExpandedIds.has(item.id))
            .map(async (item: any) => {
              try {
                item.payments = await this.financeService.getPaymentsByInvoice(item.id);
              } catch {
                item.payments = [];
              }
            })
        );
      }

      this.summary.set(summaryData);
      this.invoices.set(invoicesData);
    } catch (error) {
      console.error('Error loading finance data', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('FINANCE.LOAD_ERROR') || 'Failed to load'
      });
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  setActiveTab(tab: 'fees' | 'expenses' | 'all') {
    this.activeTab.set(tab);
    this.cdr.detectChanges();
  }

  openNewInvoice(category?: FinanceCategory) {
    const targetCategory = category ?? (this.activeTab() === 'expenses' ? FinanceCategory.Expenses : FinanceCategory.Fees);
    this.defaultInvoiceCategory.set(targetCategory);
    this.selectedInvoice.set(null);
    this.displayInvoiceDialog.set(true);
  }

  editInvoice(invoice: InvoiceListDto) {
    this.selectedInvoice.set(invoice);
    this.displayInvoiceDialog.set(true);
  }

  openNewPayment() {
    this.displayPaymentDialog.set(true);
  }

  async onInvoiceSave(data: any) {
    try {
      if (data.id) {
        await this.financeService.updateInvoice(data.id, data);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('FINANCE.UPDATE_SUCCESS') || 'Updated'
        });
      } else {
        await this.financeService.createInvoice(data);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('FINANCE.CREATE_SUCCESS') || 'Created'
        });
      }
      this.displayInvoiceDialog.set(false);
      await this.loadData();
    } catch (error: any) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: error.message || this.translate.instant('COMMON.ERROR')
      });
    }
  }

  async onPaymentSave(data: any) {
    try {
      await this.financeService.createPayment(data);
      this.messageService.add({ 
        severity: 'success', 
        summary: this.translate.instant('COMMON.SUCCESS'), 
        detail: this.translate.instant('FINANCE.PAYMENT_SUCCESS') || 'Payment recorded'
      });
      this.displayPaymentDialog.set(false);
      await this.loadData(data?.invoiceId);
    } catch (error: any) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: error.message || this.translate.instant('COMMON.ERROR')
      });
    }
  }

  async onRowExpand(event: any) {
    const invoice = event.data;

    if (!invoice.payments?.length) {
      this.invoices.update(items =>
        items.map(item =>
          item.id === invoice.id ? { ...item, loadingPayments: true } : item
        )
      );
    }

    try {
      const payments = await this.financeService.getPaymentsByInvoice(invoice.id);
      
      // Update data immutably
      this.invoices.update(items =>
        items.map(item =>
          item.id === invoice.id ? { ...item, payments, loadingPayments: false } : item
        )
      );
    } catch (error) {
      this.invoices.update(items =>
        items.map(item =>
          item.id === invoice.id ? { ...item, payments: [], loadingPayments: false } : item
        )
      );
    } finally {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }

  onRowCollapse(event: any) {
    // Handled by table API
  }

  getPaymentMethodLabel(method: number): string {
    switch (method) {
      case 0: return this.translate.instant('FINANCE.METHODS.CASH');
      case 1: return this.translate.instant('FINANCE.METHODS.BANK');
      case 2: return this.translate.instant('FINANCE.METHODS.CARD');
      case 3: return this.translate.instant('FINANCE.METHODS.CHECK');
      case 5: return this.translate.instant('FINANCE.METHODS.WALLET');
      default: return this.translate.instant('FINANCE.METHODS.OTHER');
    }
  }

  getPaymentMethodIcon(method: any): string {
    const val = typeof method === 'number' ? method : Number(method);
    switch (val) {
      case 0: return 'pi pi-money-bill'; // Cash
      case 1: return 'pi pi-building';   // Bank Transfer
      case 2: return 'pi pi-credit-card';// Card
      case 3: return 'pi pi-file-edit';  // Check
      case 5: return 'pi pi-mobile';     // Electronic Wallet
      default: return 'pi pi-wallet';
    }
  }

  getCategoryLabel(category?: number): string {
    return (category === FinanceCategory.Expenses)
      ? this.translate.instant('FINANCE.CATEGORIES.EXPENSES')
      : this.translate.instant('FINANCE.CATEGORIES.FEES');
  }

  getCategoryIcon(category?: number): string {
    return (category === FinanceCategory.Expenses) ? 'pi pi-receipt' : 'pi pi-briefcase';
  }

  getCategorySeverity(category?: number): 'warn' | 'info' {
    return (category === FinanceCategory.Expenses) ? 'warn' : 'info';
  }

  getStatusSeverity(status: InvoiceStatus): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case InvoiceStatus.Paid: return 'success';
      case InvoiceStatus.PartiallyPaid: return 'info';
      case InvoiceStatus.Unpaid: return 'warn';
      case InvoiceStatus.Overdue: return 'danger';
      case InvoiceStatus.Cancelled: return 'secondary';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.Paid: return this.translate.instant('FINANCE.PAID');
      case InvoiceStatus.PartiallyPaid: return this.translate.instant('FINANCE.PARTIAL');
      case InvoiceStatus.Unpaid: return this.translate.instant('FINANCE.UNPAID');
      case InvoiceStatus.Overdue: return this.translate.instant('FINANCE.OVERDUE');
      case InvoiceStatus.Cancelled: return this.translate.instant('CASES.CANCELLED');
      default: return 'Unknown';
    }
  }
}
