import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
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
import { FinanceService, InvoiceListDto, FinancialSummaryDto, InvoiceStatus } from '../../../core/services/finance.service';
import { InvoiceDialog } from '../invoice-dialog/invoice-dialog';
import { PaymentDialog } from '../payment-dialog/payment-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';

@Component({
  selector: 'app-finance-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardModule,
    ToastModule,
    TooltipModule,
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



  // Dialogs
  displayInvoiceDialog = signal(false);
  displayPaymentDialog = signal(false);
  selectedInvoice = signal<InvoiceListDto | null>(null);

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const [summaryData, invoicesData] = await Promise.all([
        this.financeService.getGlobalSummary(),
        this.financeService.getInvoices()
      ]);
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

  openNewInvoice() {
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
      await this.loadData();
    } catch (error: any) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: error.message || this.translate.instant('COMMON.ERROR')
      });
    }
  }

  // onRowExpand logic is already handled, just cleaning up unused signal
  async onRowExpand(event: any) {
    const invoice = event.data;

    if (invoice.payments?.length) {
      return;
    }

    // Set loading state immutably
    this.invoices.update(items =>
      items.map(item =>
        item.id === invoice.id ? { ...item, loadingPayments: true } : item
      )
    );

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
      default: return this.translate.instant('FINANCE.METHODS.OTHER');
    }
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
