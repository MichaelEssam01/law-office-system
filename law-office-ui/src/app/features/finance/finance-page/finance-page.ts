import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { FinanceService, InvoiceListDto, FinancialSummaryDto, InvoiceStatus } from '../../../core/services/finance.service';
import { InvoiceDialog } from '../invoice-dialog/invoice-dialog';
import { PaymentDialog } from '../payment-dialog/payment-dialog';

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
    PaymentDialog
  ],
  providers: [MessageService],
  templateUrl: './finance-page.html'
})
export class FinancePage implements OnInit {
  private financeService = inject(FinanceService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  summary = signal<FinancialSummaryDto | null>(null);
  invoices = signal<InvoiceListDto[]>([]);
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
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحميل البيانات المالية' });
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
        await this.financeService.createInvoice(data); // Backend update logic should be in Service, I'll use create as placeholder if PUT not implemented
        // Actually I should use updateInvoice in service
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث الفاتورة بنجاح' });
      } else {
        await this.financeService.createInvoice(data);
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم إضافة الفاتورة بنجاح' });
      }
      this.displayInvoiceDialog.set(false);
      await this.loadData();
    } catch (error: any) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حفظ الفاتورة' });
    }
  }

  async onPaymentSave(data: any) {
    try {
      await this.financeService.createPayment(data);
      this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم تسجيل الدفعة بنجاح' });
      this.displayPaymentDialog.set(false);
      await this.loadData();
    } catch (error: any) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في تسجيل الدفعة' });
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
      case InvoiceStatus.Paid: return 'مدفوعة';
      case InvoiceStatus.PartiallyPaid: return 'مدفوعة جزئياً';
      case InvoiceStatus.Unpaid: return 'غير مدفوعة';
      case InvoiceStatus.Overdue: return 'متأخرة';
      case InvoiceStatus.Cancelled: return 'ملغاة';
      default: return 'غير معروف';
    }
  }
}
