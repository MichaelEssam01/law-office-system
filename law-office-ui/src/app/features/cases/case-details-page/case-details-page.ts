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
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { 
  CaseService, 
  CaseDetailDto, 
  CaseStatus, 
  CaseType, 
  FamilyCaseSubtype, 
  LitigationDegree, 
  PartyCapacity, 
  DisputeNature 
} from '../../../core/services/case.service';
import { SessionService, SessionListDto, SessionStatus, SessionDetailDto } from '../../../core/services/session.service';
import { FinanceService, InvoiceListDto, PaymentListDto, FinancialSummaryDto, InvoiceStatus, PaymentMethod } from '../../../core/services/finance.service';
import { DocumentService, DocumentDto, DocumentCategory } from '../../../core/services/document.service';
import { CaseDialog } from '../case-dialog/case-dialog';
import { SessionDialog } from '../../sessions/session-dialog/session-dialog';
import { InvoiceDialog } from '../../finance/invoice-dialog/invoice-dialog';
import { PaymentDialog } from '../../finance/payment-dialog/payment-dialog';
import { DocumentUploadDialog } from '../document-upload-dialog/document-upload-dialog';
import { SuspensionReasonPipe } from '../../../core/pipes/suspension-reason.pipe';

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
    TranslateModule,
    CaseDialog,
    SessionDialog,
    InvoiceDialog,
    PaymentDialog,
    DocumentUploadDialog,
    SuspensionReasonPipe
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
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);

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

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.caseId.set(id);
        Promise.all([
          this.loadCaseDetails(id),
          this.loadSessions(id),
          this.loadFinanceData(id),
          this.loadDocuments(id)
        ]);
      }
    });
  }

  async loadCaseDetails(id: string) {
    this.loading.set(true);
    try {
      const data = await this.caseService.getCaseById(id);
      this.case.set(data);
    } catch (error) {
      console.error('Error loading case details', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('CASES.DETAILS_ERROR') 
      });
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
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('CASES.UPDATE_SUCCESS') 
        });
        if (this.caseId()) await this.loadCaseDetails(this.caseId()!);
      }
      this.displayDialog.set(false);
    } catch (error) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('CASES.SAVE_ERROR') 
      });
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
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('SESSIONS.DETAILS_ERROR') 
      });
    }
  }

  deleteSession(sessionItem: SessionListDto) {
    this.confirmationService.confirm({
      message: this.translate.instant('SESSIONS.DELETE_CONFIRM', { title: sessionItem.title }),
      header: this.translate.instant('CASES.DELETE_CONFIRM_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('CASES.DELETE_ACCEPT'),
      rejectLabel: this.translate.instant('COMMON.CANCEL'),
      accept: async () => {
        try {
          await this.sessionService.deleteSession(sessionItem.id);
          this.messageService.add({ 
            severity: 'success', 
            summary: this.translate.instant('COMMON.SUCCESS'), 
            detail: this.translate.instant('SESSIONS.DELETE_SUCCESS') 
          });
          if (this.caseId()) await this.loadSessions(this.caseId()!);
        } catch (error) {
          this.messageService.add({ 
            severity: 'error', 
            summary: this.translate.instant('COMMON.ERROR'), 
            detail: this.translate.instant('SESSIONS.DELETE_ERROR') 
          });
        }
      }
    });
  }

  private isSavingSession = false;
  private isSavingInvoice = false;
  private isSavingPayment = false;

  async onSessionSave(sessionData: any) {
    if (this.isSavingSession || !this.displaySessionDialog()) return;
    this.isSavingSession = true;
    try {
      if (sessionData.id) {
        await this.sessionService.updateSession(sessionData.id, sessionData);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('SESSIONS.UPDATE_SUCCESS') 
        });
      } else {
        if (!sessionData.caseId && this.caseId()) sessionData.caseId = this.caseId();
        await this.sessionService.createSession(sessionData);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('SESSIONS.CREATE_SUCCESS') 
        });
      }
      this.displaySessionDialog.set(false);
      this.selectedSession.set(null);
      if (this.caseId()) await this.loadSessions(this.caseId()!);
    } catch (error) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('SESSIONS.SAVE_ERROR') 
      });
    } finally {
      this.isSavingSession = false;
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

  async openNewPayment() {
    const id = this.caseId();
    if (id) {
      await this.loadFinanceData(id);
    }
    this.displayPaymentDialog.set(true);
  }

  async onInvoiceSave(data: any) {
    if (this.isSavingInvoice || !this.displayInvoiceDialog()) return;
    this.isSavingInvoice = true;
    try {
      if (!data.caseId && this.caseId()) data.caseId = this.caseId();
      
      if (data.id) {
        await this.financeService.updateInvoice(data.id, data);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('CASES.UPDATE_SUCCESS') 
        });
      } else {
        await this.financeService.createInvoice(data);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('CASES.CREATE_SUCCESS') 
        });
      }
      this.displayInvoiceDialog.set(false);
      if (this.caseId()) await this.loadFinanceData(this.caseId()!);
    } catch (error: any) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: error.message || this.translate.instant('CASES.SAVE_ERROR') 
      });
    } finally {
      this.isSavingInvoice = false;
    }
  }

  async onPaymentSave(data: any) {
    if (this.isSavingPayment || !this.displayPaymentDialog()) return;
    this.isSavingPayment = true;
    try {
      if (!data.caseId && this.caseId()) data.caseId = this.caseId();
      await this.financeService.createPayment(data);
      this.messageService.add({ 
        severity: 'success', 
        summary: this.translate.instant('COMMON.SUCCESS'), 
        detail: this.translate.instant('FINANCE.CREATE_SUCCESS') || 'Success' 
      });
      this.displayPaymentDialog.set(false);
      if (this.caseId()) await this.loadFinanceData(this.caseId()!);
    } catch (error: any) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: error.message || this.translate.instant('CASES.SAVE_ERROR') 
      });
    } finally {
      this.isSavingPayment = false;
    }
  }

  // Document Actions
  openUploadDialog() {
    this.displayUploadDialog.set(true);
  }

  async onUploadSuccess() {
    this.messageService.add({ 
      severity: 'success', 
      summary: this.translate.instant('COMMON.SUCCESS'), 
      detail: this.translate.instant('CASES.UPLOAD_SUCCESS') || 'Document uploaded'
    });
    if (this.caseId()) await this.loadDocuments(this.caseId()!);
  }

  async openDocument(doc: DocumentDto) {
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

  async downloadDocument(doc: DocumentDto) {
    try {
      await this.documentService.downloadDocument(doc.id, doc.originalFileName);
    } catch (error) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('CASES.DOWNLOAD_ERROR') || 'Download failed'
      });
    }
  }

  deleteDocument(doc: DocumentDto) {
    this.confirmationService.confirm({
      message: this.translate.instant('CASES.DELETE_CONFIRM_MESSAGE', { caseNumber: doc.originalFileName }),
      header: this.translate.instant('CASES.DELETE_CONFIRM_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('CASES.DELETE_ACCEPT'),
      rejectLabel: this.translate.instant('COMMON.CANCEL'),
      accept: async () => {
        try {
          await this.documentService.deleteDocument(doc.id);
          this.messageService.add({ 
            severity: 'success', 
            summary: this.translate.instant('COMMON.SUCCESS'), 
            detail: this.translate.instant('CASES.DELETE_SUCCESS') 
          });
          if (this.caseId()) await this.loadDocuments(this.caseId()!);
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

  // Status Helpers
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
      default: return this.translate.instant('COMMON.UNKNOWN');
    }
  }

  getCaseTypeLabel(type?: CaseType | null): string {
    if (type === undefined || type === null) return '';
    const keys: Record<CaseType, string> = {
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
    return keys[type] ? this.translate.instant(keys[type]) : '';
  }

  getOtherPersonsList(otherPersonName?: string | null, otherLawyerName?: string | null): { name: string, lawyer?: string }[] {
    if (!otherPersonName) return [];
    try {
      const parsed = JSON.parse(otherPersonName);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [{ name: otherPersonName, lawyer: otherLawyerName || undefined }];
  }

  getFamilySubtypeLabel(subtype?: FamilyCaseSubtype | null): string {
    if (subtype === undefined || subtype === null) return '';
    const keys: Record<FamilyCaseSubtype, string> = {
      [FamilyCaseSubtype.Financial]: 'CASES.FAMILY_SUBTYPES.FINANCIAL',
      [FamilyCaseSubtype.Miscellaneous]: 'CASES.FAMILY_SUBTYPES.MISCELLANEOUS',
      [FamilyCaseSubtype.Imprisonment]: 'CASES.FAMILY_SUBTYPES.IMPRISONMENT',
      [FamilyCaseSubtype.Inheritance]: 'CASES.FAMILY_SUBTYPES.INHERITANCE'
    };
    return keys[subtype] ? this.translate.instant(keys[subtype]) : '';
  }

  getLitigationDegreeLabel(degree?: LitigationDegree | null): string {
    if (degree === undefined || degree === null) return '';
    const keys: Record<LitigationDegree, string> = {
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
    return keys[degree] ? this.translate.instant(keys[degree]) : '';
  }

  getPartyCapacityLabel(capacity?: PartyCapacity | null): string {
    if (capacity === undefined || capacity === null) return '';
    const keys: Record<PartyCapacity, string> = {
      [PartyCapacity.Plaintiff]: 'CASES.CAPACITIES.PLAINTIFF',
      [PartyCapacity.Defendant]: 'CASES.CAPACITIES.DEFENDANT',
      [PartyCapacity.OffensiveIntervener]: 'CASES.CAPACITIES.OFFENSIVE_INTERVENER',
      [PartyCapacity.AdhesiveIntervener]: 'CASES.CAPACITIES.ADHESIVE_INTERVENER',
      [PartyCapacity.JoinedParty]: 'CASES.CAPACITIES.JOINED_PARTY',
      [PartyCapacity.Appellant]: 'CASES.CAPACITIES.APPELLANT',
      [PartyCapacity.Appellee]: 'CASES.CAPACITIES.APPELLEE',
      [PartyCapacity.Challenger]: 'CASES.CAPACITIES.CHALLENGER',
      [PartyCapacity.Respondent]: 'CASES.CAPACITIES.RESPONDENT',
      [PartyCapacity.Victim]: 'CASES.CAPACITIES.VICTIM',
      [PartyCapacity.Accused]: 'CASES.CAPACITIES.ACCUSED',
      [PartyCapacity.CivilRightPlaintiff]: 'CASES.CAPACITIES.CIVIL_RIGHT_PLAINTIFF',
      [PartyCapacity.Other]: 'CASES.CAPACITIES.OTHER'
    };
    return keys[capacity] ? this.translate.instant(keys[capacity]) : '';
  }

  getDisputeNatureLabel(nature?: DisputeNature | null): string {
    if (nature === undefined || nature === null) return '';
    return nature === DisputeNature.Original 
      ? this.translate.instant('CASES.DISPUTE_ORIGINAL') 
      : this.translate.instant('CASES.DISPUTE_CONFRONTATIONAL');
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
      case SessionStatus.Scheduled: return this.translate.instant('SESSIONS.SCHEDULED');
      case SessionStatus.Completed: return this.translate.instant('SESSIONS.COMPLETED');
      case SessionStatus.Postponed: return this.translate.instant('SESSIONS.POSTPONED');
      case SessionStatus.Cancelled: return this.translate.instant('SESSIONS.CANCELLED');
      default: return this.translate.instant('COMMON.UNKNOWN');
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
      case InvoiceStatus.Paid: return this.translate.instant('FINANCE.STATUS_LABELS.PAID');
      case InvoiceStatus.PartiallyPaid: return this.translate.instant('FINANCE.STATUS_LABELS.PARTIAL');
      case InvoiceStatus.Unpaid: return this.translate.instant('FINANCE.STATUS_LABELS.UNPAID');
      case InvoiceStatus.Overdue: return this.translate.instant('FINANCE.STATUS_LABELS.OVERDUE');
      case InvoiceStatus.Cancelled: return this.translate.instant('FINANCE.STATUS_LABELS.CANCELLED');
      default: return this.translate.instant('COMMON.UNKNOWN');
    }
  }

  getDocCategoryLabel(category: DocumentCategory): string {
    switch (category) {
      case DocumentCategory.Contract: return this.translate.instant('DOCUMENTS.CONTRACT');
      case DocumentCategory.CourtDocument: return this.translate.instant('DOCUMENTS.COURT');
      case DocumentCategory.Evidence: return this.translate.instant('DOCUMENTS.EVIDENCE');
      case DocumentCategory.Invoice: return this.translate.instant('DOCUMENTS.INVOICE');
      case DocumentCategory.Other: return this.translate.instant('DOCUMENTS.OTHER');
      default: return this.translate.instant('DOCUMENTS.OTHER');
    }
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.Cash: return this.translate.instant('FINANCE.METHODS.CASH');
      case PaymentMethod.BankTransfer: return this.translate.instant('FINANCE.METHODS.BANK');
      case PaymentMethod.CreditCard: return this.translate.instant('FINANCE.METHODS.CARD');
      case PaymentMethod.Check: return this.translate.instant('FINANCE.METHODS.CHECK');
      default: return this.translate.instant('FINANCE.METHODS.OTHER');
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
