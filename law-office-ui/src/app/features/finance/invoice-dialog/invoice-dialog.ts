import { Component, Input, Output, EventEmitter, inject, signal, effect, model, input, untracked, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CaseService, CaseListDto } from '../../../core/services/case.service';
import { ClientService, Client } from '../../../core/services/client';
import { InvoiceStatus, InvoiceListDto } from '../../../core/services/finance.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';

@Component({
  selector: 'app-invoice-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ConfirmDialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    TranslateModule
  ],
  providers: [ConfirmationService],
  templateUrl: './invoice-dialog.html'
})
export class InvoiceDialog {
  private fb = inject(FormBuilder);
  private caseService = inject(CaseService);
  private clientService = inject(ClientService);
  private translate = inject(TranslateService);
  private confirmationService = inject(ConfirmationService);
  public appState = inject(AppStateService);
  private cdr = inject(ChangeDetectorRef);

  visible = model<boolean>(false);
  invoice = input<InvoiceListDto | null>(null);
  caseId = input<string | null>(null);
  @Output() onSave = new EventEmitter<any>();

  invoiceForm: FormGroup;
  saving = signal(false);
  clients = signal<Client[]>([]);
  cases = signal<CaseListDto[]>([]);

  // Client filtering
  selectedClientId = signal<string | null>(null);

  filteredCases = computed(() => {
    const clientId = this.selectedClientId();
    if (!clientId) return this.cases();
    return this.cases().filter(c => c.clientId === clientId);
  });

  statuses = signal<any[]>([]);

  constructor() {
    this.invoiceForm = this.fb.group({
      id: [null],
      caseId: [null, Validators.required],
      invoiceNumber: [''],
      title: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      dueDate: [new Date(), Validators.required],
      status: [InvoiceStatus.Unpaid],
      notes: ['']
    });

    // Update statuses labels when language changes
    effect(() => {
      this.appState.currentLang(); // Track language changes
      
      this.translate.get([
        'FINANCE.STATUS_LABELS.UNPAID',
        'FINANCE.STATUS_LABELS.PARTIAL',
        'FINANCE.STATUS_LABELS.PAID',
        'FINANCE.STATUS_LABELS.OVERDUE',
        'FINANCE.STATUS_LABELS.CANCELLED'
      ]).subscribe(translations => {
        this.statuses.set([
          { label: translations['FINANCE.STATUS_LABELS.UNPAID'], value: InvoiceStatus.Unpaid },
          { label: translations['FINANCE.STATUS_LABELS.PARTIAL'], value: InvoiceStatus.PartiallyPaid },
          { label: translations['FINANCE.STATUS_LABELS.PAID'], value: InvoiceStatus.Paid },
          { label: translations['FINANCE.STATUS_LABELS.OVERDUE'], value: InvoiceStatus.Overdue },
          { label: translations['FINANCE.STATUS_LABELS.CANCELLED'], value: InvoiceStatus.Cancelled }
        ]);
      });
    });

    // Load data and reset form when dialog opens
    effect(async () => {
      const isVisible = this.visible();
      if (isVisible) {
        // 1. Load data
        await Promise.all([
          this.loadCases(),
          this.loadClients()
        ]);
        
        // 2. Reset form (untracked to avoid re-triggering effect)
        untracked(() => {
          const inv = this.invoice();
          const currentCaseId = this.caseId();
          this.selectedClientId.set(null);
          
          if (inv) {
            this.selectedClientId.set(inv.clientId || null); // Note: Might need clientId in InvoiceListDto
            this.invoiceForm.patchValue({
              ...inv,
              dueDate: new Date(inv.dueDate)
            });
          } else {
            if (currentCaseId) {
              const c = this.cases().find(x => x.id === currentCaseId);
              if (c) this.selectedClientId.set(c.clientId);
            }
            this.invoiceForm.reset({
              id: null,
              caseId: currentCaseId,
              invoiceNumber: '',
              title: '',
              status: InvoiceStatus.Unpaid,
              dueDate: new Date(),
              amount: 0,
              notes: ''
            });
          }
          this.cdr.detectChanges();
        });
      }
    });
  }

  getSelectedCase() {
    const id = this.invoiceForm.get('caseId')?.value;
    return this.cases().find(c => c.id === id);
  }

  getStatusLabel(status: InvoiceStatus): string {
    const s = this.statuses().find(x => x.value === status);
    return s ? s.label : '';
  }

  getStatusClass(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.Paid: return 'bg-green-100 text-green-700';
      case InvoiceStatus.PartiallyPaid: return 'bg-blue-100 text-blue-700';
      case InvoiceStatus.Overdue: return 'bg-red-100 text-red-700';
      case InvoiceStatus.Cancelled: return 'bg-slate-100 text-slate-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  }

  confirmCancelInvoice() {
    this.confirmationService.confirm({
      message: this.translate.instant('FINANCE.CANCEL_CONFIRM'),
      header: this.translate.instant('CASES.DELETE_CONFIRM_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('CASES.DELETE_ACCEPT'),
      rejectLabel: this.translate.instant('CASES.DELETE_REJECT'),
      accept: () => {
        this.invoiceForm.get('status')?.setValue(InvoiceStatus.Cancelled);
        this.save();
      }
    });
  }

  async loadCases() {
    try {
      this.cases.set(await this.caseService.getCases());
    } catch (error) {
      console.error('Error loading cases', error);
    }
  }

  async loadClients() {
    try {
      this.clients.set(await this.clientService.getClients());
    } catch (error) {
      console.error('Error loading clients', error);
    }
  }

  onClientChange(event: any) {
    const clientId = event.value;
    this.selectedClientId.set(clientId);
    
    // Reset case if it doesn't belong to client
    const currentCaseId = this.invoiceForm.get('caseId')?.value;
    const c = this.cases().find(x => x.id === currentCaseId);
    if (c && c.clientId !== clientId) {
      this.invoiceForm.get('caseId')?.setValue(null);
    }
  }

  async save() {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      this.onSave.emit(this.invoiceForm.value);
    } finally {
      this.saving.set(false);
    }
  }

  close() {
    this.visible.set(false);
  }
}
