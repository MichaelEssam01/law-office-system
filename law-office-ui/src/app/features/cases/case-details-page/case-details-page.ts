import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CaseService, CaseDetailDto, CaseStatus } from '../../../core/services/case.service';
import { SessionService, SessionListDto, SessionStatus, SessionDetailDto } from '../../../core/services/session.service';
import { FinanceService, InvoiceListDto, PaymentListDto, FinancialSummaryDto, InvoiceStatus } from '../../../core/services/finance.service';
import { DocumentService, DocumentDto, DocumentCategory } from '../../../core/services/document.service';
import { CaseDialog } from '../case-dialog/case-dialog';
import { SessionDialog } from '../../sessions/session-dialog/session-dialog';
import { InvoiceDialog } from '../../finance/invoice-dialog/invoice-dialog';
import { PaymentDialog } from '../../finance/payment-dialog/payment-dialog';
import { DocumentUploadDialog } from '../document-upload-dialog/document-upload-dialog';

@Component({
  selector: 'app-case-details-page',
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
    CaseDialog,
    SessionDialog,
    InvoiceDialog,
    PaymentDialog,
    DocumentUploadDialog  
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './case-details-page.html'
})
export class CaseDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private caseService = inject(CaseService);
  private sessionService = inject(SessionService);
  private financeService = inject(FinanceService);
  private documentService = inject(DocumentService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  caseId = signal<string | null>(null);
  case = signal<CaseDetailDto | null>(null);
  loading = signal(true);
  
  // Dialogs
  displayDialog = signal(false);
  displaySessionDialog = signal(false);
  displayInvoiceDialog = signal(false);
  displayPaymentDialog = signal(false);
  displayUploadDialog = signal(false);

  // Data
  sessions = signal<SessionListDto[]>([]);
  sessionsLoading = signal(true);
  selectedSession = signal<SessionDetailDto | null>(null);

  financeSummary = signal<FinancialSummaryDto | null>(null);
  caseInvoices = signal<InvoiceListDto[]>([]);
  casePayments = signal<PaymentListDto[]>([]);
  financeLoading = signal(true);
  selectedInvoiceForEdit = signal<InvoiceListDto | null>(null);

  documents = signal<DocumentDto[]>([]);
  docsLoading = signal(true);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.caseId.set(id);
      await Promise.all([
        this.loadCaseDetails(id),
        this.loadSessions(id),
        this.loadFinanceData(id),
        this.loadDocuments(id)
      ]);
    }
  }

  async loadCaseDetails(id: string) {
    this.loading.set(true);
    try {
      const data = await this.caseService.getCaseById(id);
      this.case.set(data);
    } catch (error) {
      console.error('Error loading case details', error);
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحميل تفاصيل القضية' });
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  async loadSessions(id: string) {
    this.sessionsLoading.set(true);
    try {
      const data = await this.sessionService.getSessions({ caseId: id });
      this.sessions.set(data);
    } catch (error) {
      console.error('Error loading sessions', error);
    } finally {
      this.sessionsLoading.set(false);
      this.cdr.detectChanges();
    }
  }

  async loadFinanceData(id: string) {
    this.financeLoading.set(true);
    try {
      const [summary, invoices, payments] = await Promise.all([
        this.financeService.getCaseSummary(id),
        this.financeService.getInvoices(id),
        this.financeService.getPayments(id)
      ]);
      this.financeSummary.set(summary);
      this.caseInvoices.set(invoices);
      this.casePayments.set(payments);
    } catch (error) {
      console.error('Error loading finance data', error);
    } finally {
      this.financeLoading.set(false);
      this.cdr.detectChanges();
    }
  }

  async loadDocuments(id: string) {
    this.docsLoading.set(true);
    try {
      const data = await this.documentService.getCaseDocuments(id);
      this.documents.set(data);
    } catch (error) {
      console.error('Error loading documents', error);
    } finally {
      this.docsLoading.set(false);
      this.cdr.detectChanges();
    }
  }

  editCase() {
    this.displayDialog.set(true);
  }

  async onSave(caseData: any) {
    try {
      if (caseData.id) {
        await this.caseService.updateCase(caseData.id, caseData);
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث القضية بنجاح' });
        if (this.caseId()) await this.loadCaseDetails(this.caseId()!);
      }
      this.displayDialog.set(false);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حفظ التغييرات' });
    }
  }

  // Session Actions
  openNewSession() {
    this.selectedSession.set(null);
    this.displaySessionDialog.set(true);
  }

  async editSession(sessionItem: SessionListDto) {
    try {
      const fullSession = await this.sessionService.getSessionById(sessionItem.id);
      this.selectedSession.set(fullSession);
      this.displaySessionDialog.set(true);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحميل تفاصيل الجلسة' });
    }
  }

  deleteSession(sessionItem: SessionListDto) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف جلسة "${sessionItem.title}"؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، احذف',
      rejectLabel: 'إلغاء',
      accept: async () => {
        try {
          await this.sessionService.deleteSession(sessionItem.id);
          this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الجلسة بنجاح' });
          if (this.caseId()) await this.loadSessions(this.caseId()!);
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حذف الجلسة' });
        }
      }
    });
  }

  async onSessionSave(sessionData: any) {
    try {
      if (sessionData.id) {
        await this.sessionService.updateSession(sessionData.id, sessionData);
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث الجلسة بنجاح' });
      } else {
        if (!sessionData.caseId && this.caseId()) sessionData.caseId = this.caseId();
        await this.sessionService.createSession(sessionData);
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم إضافة الجلسة بنجاح' });
      }
      this.displaySessionDialog.set(false);
      if (this.caseId()) await this.loadSessions(this.caseId()!);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حفظ الجلسة' });
    }
  }

  // Finance Actions
  openNewInvoice() {
    this.selectedInvoiceForEdit.set(null);
    this.displayInvoiceDialog.set(true);
  }

  editInvoice(invoice: InvoiceListDto) {
    this.selectedInvoiceForEdit.set(invoice);
    this.displayInvoiceDialog.set(true);
  }

  openNewPayment() {
    this.displayPaymentDialog.set(true);
  }

  async onInvoiceSave(data: any) {
    try {
      if (!data.caseId && this.caseId()) data.caseId = this.caseId();
      await this.financeService.createInvoice(data);
      this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم إضافة الفاتورة بنجاح' });
      this.displayInvoiceDialog.set(false);
      if (this.caseId()) await this.loadFinanceData(this.caseId()!);
    } catch (error: any) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حفظ الفاتورة' });
    }
  }

  async onPaymentSave(data: any) {
    try {
      if (!data.caseId && this.caseId()) data.caseId = this.caseId();
      await this.financeService.createPayment(data);
      this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم تسجيل الدفعة بنجاح' });
      this.displayPaymentDialog.set(false);
      if (this.caseId()) await this.loadFinanceData(this.caseId()!);
    } catch (error: any) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في تسجيل الدفعة' });
    }
  }

  // Document Actions
  openUploadDialog() {
    this.displayUploadDialog.set(true);
  }

  async onUploadSuccess() {
    this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم رفع المستند بنجاح' });
    if (this.caseId()) await this.loadDocuments(this.caseId()!);
  }

  async downloadDocument(doc: DocumentDto) {
    try {
      await this.documentService.downloadDocument(doc.id, doc.originalFileName);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحميل الملف' });
    }
  }

  deleteDocument(doc: DocumentDto) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف المستند "${doc.originalFileName}"؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، احذف',
      rejectLabel: 'إلغاء',
      accept: async () => {
        try {
          await this.documentService.deleteDocument(doc.id);
          this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف المستند بنجاح' });
          if (this.caseId()) await this.loadDocuments(this.caseId()!);
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حذف المستند' });
        }
      }
    });
  }

  // Status Helpers
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
      case CaseStatus.Open: return 'مفتوحة';
      case CaseStatus.Pending: return 'قيد الانتظار';
      case CaseStatus.Closed: return 'مغلقة';
      default: return 'غير معروف';
    }
  }

  getSessionStatusSeverity(status: SessionStatus): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case SessionStatus.Scheduled: return 'info';
      case SessionStatus.Completed: return 'success';
      case SessionStatus.Postponed: return 'warn';
      case SessionStatus.Cancelled: return 'danger';
      default: return 'secondary';
    }
  }

  getSessionStatusLabel(status: SessionStatus): string {
    switch (status) {
      case SessionStatus.Scheduled: return 'مجدولة';
      case SessionStatus.Completed: return 'مكتملة';
      case SessionStatus.Postponed: return 'مؤجلة';
      case SessionStatus.Cancelled: return 'ملغاة';
      default: return 'غير معروف';
    }
  }

  getInvoiceStatusSeverity(status: InvoiceStatus): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case InvoiceStatus.Paid: return 'success';
      case InvoiceStatus.PartiallyPaid: return 'info';
      case InvoiceStatus.Unpaid: return 'warn';
      case InvoiceStatus.Overdue: return 'danger';
      case InvoiceStatus.Cancelled: return 'secondary';
      default: return 'secondary';
    }
  }

  getInvoiceStatusLabel(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.Paid: return 'مدفوعة';
      case InvoiceStatus.PartiallyPaid: return 'مدفوعة جزئياً';
      case InvoiceStatus.Unpaid: return 'غير مدفوعة';
      case InvoiceStatus.Overdue: return 'متأخرة';
      case InvoiceStatus.Cancelled: return 'ملغاة';
      default: return 'غير معروف';
    }
  }

  getDocCategoryLabel(category: DocumentCategory): string {
    switch (category) {
      case DocumentCategory.Contract: return 'عقد';
      case DocumentCategory.CourtDocument: return 'وثيقة محكمة';
      case DocumentCategory.Evidence: return 'دليل';
      case DocumentCategory.Invoice: return 'فاتورة';
      case DocumentCategory.Other: return 'أخرى';
      default: return 'أخرى';
    }
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
