import { Component, Input, Output, EventEmitter, inject, signal, effect, model, input, computed, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CaseService, CaseListDto } from '../../../core/services/case.service';
import { ClientService, Client } from '../../../core/services/client';
import { FinanceService, PaymentMethod, InvoiceListDto, FinancialSummaryDto, InvoiceStatus, FinanceCategory } from '../../../core/services/finance.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { TooltipModule } from 'primeng/tooltip';
import { AutoSelectFilterDirective } from '../../../core/directives/auto-select-filter.directive';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    SelectModule,
    AutoSelectFilterDirective,
    DatePickerModule,
    TextareaModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './payment-dialog.html'
})
export class PaymentDialog {
  private fb = inject(FormBuilder);
  private caseService = inject(CaseService);
  private clientService = inject(ClientService);
  private financeService = inject(FinanceService);
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);

  visible = model<boolean>(false);
  caseId = input<string | null>(null);
  @Output() onSave = new EventEmitter<any>();

  paymentForm: FormGroup;
  saving = signal(false);
  submitted = signal(false);
  clients = signal<Client[]>([]);
  cases = signal<CaseListDto[]>([]);
  allInvoices = signal<InvoiceListDto[]>([]);
  
  // Local state for client filtering
  selectedClientId = signal<string | null>(null);

  // Set of caseIds that have unpaid balance > 0
  caseIdsWithPendingBalance = computed(() => {
    const unpaidCaseIds = new Set<string>();
    for (const inv of this.allInvoices()) {
      const remaining = inv.remainingAmount ?? (inv.amount - inv.paidAmount);
      if (remaining > 0 && inv.status !== InvoiceStatus.Cancelled && inv.caseId) {
        unpaidCaseIds.add(inv.caseId);
      }
    }
    return unpaidCaseIds;
  });

  // Clients that have at least one case with pending unpaid balance
  filteredClients = computed(() => {
    const unpaidCases = this.caseIdsWithPendingBalance();
    const clientIdsWithPending = new Set<string>();
    for (const c of this.cases()) {
      if (unpaidCases.has(c.id) && c.clientId) {
        clientIdsWithPending.add(c.clientId);
      }
    }
    for (const inv of this.allInvoices()) {
      const remaining = inv.remainingAmount ?? (inv.amount - inv.paidAmount);
      if (remaining > 0 && inv.status !== InvoiceStatus.Cancelled && inv.clientId) {
        clientIdsWithPending.add(inv.clientId);
      }
    }
    return this.clients().filter(cl => cl.id && clientIdsWithPending.has(cl.id));
  });
  
  // Computed for filtered cases (only cases with pending money)
  filteredCases = computed(() => {
    const clientId = this.selectedClientId();
    const unpaidCases = this.caseIdsWithPendingBalance();
    return this.cases().filter(c => {
      const matchesClient = !clientId || c.clientId === clientId;
      const hasPending = unpaidCases.has(c.id) || c.id === this.caseId();
      return matchesClient && hasPending;
    });
  });

  localInvoices = signal<InvoiceListDto[]>([]); 
  selectedInvoice = signal<InvoiceListDto | null>(null);
  caseSummary = signal<FinancialSummaryDto | null>(null);

  // Computed signal for the invoices dropdown
  filteredInvoices = computed(() => {
    return this.localInvoices().filter(i => {
      const remaining = i.remainingAmount ?? (i.amount - i.paidAmount);
      return remaining > 0 && i.status !== InvoiceStatus.Cancelled;
    });
  });

  methods = signal<any[]>([]);

  constructor() {
    this.paymentForm = this.fb.group({
      caseId: [null, Validators.required],
      invoiceId: [null],
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentDate: [new Date(), Validators.required],
      method: [PaymentMethod.Cash, Validators.required],
      category: [FinanceCategory.Fees],
      notes: ['']
    });

    // Update methods labels when language changes
    effect(() => {
      this.appState.currentLang(); // Track language changes
      
      this.translate.get([
        'FINANCE.METHODS.CASH',
        'FINANCE.METHODS.BANK',
        'FINANCE.METHODS.CARD',
        'FINANCE.METHODS.CHECK',
        'FINANCE.METHODS.WALLET',
        'FINANCE.METHODS.OTHER'
      ]).subscribe(translations => {
        this.methods.set([
          { label: translations['FINANCE.METHODS.CASH'], value: PaymentMethod.Cash, icon: 'pi pi-money-bill' },
          { label: translations['FINANCE.METHODS.BANK'], value: PaymentMethod.BankTransfer, icon: 'pi pi-building' },
          { label: translations['FINANCE.METHODS.CARD'], value: PaymentMethod.CreditCard, icon: 'pi pi-credit-card' },
          { label: translations['FINANCE.METHODS.CHECK'], value: PaymentMethod.Check, icon: 'pi pi-file-edit' },
          { label: translations['FINANCE.METHODS.WALLET'], value: PaymentMethod.ElectronicWallet, icon: 'pi pi-mobile' },
          { label: translations['FINANCE.METHODS.OTHER'], value: PaymentMethod.Other, icon: 'pi pi-wallet' }
        ]);
      });
    });

    // Single effect to handle initialization and case loading when dialog opens
    effect(async () => {
      const isVisible = this.visible();
      if (isVisible) {
        const currentCaseId = untracked(() => this.caseId());

        // Reset form and state synchronously BEFORE awaiting API calls so no stale validation shows on open
        untracked(() => {
          this.submitted.set(false);
          this.selectedClientId.set(null);
          this.localInvoices.set([]);
          this.selectedInvoice.set(null);
          this.caseSummary.set(null);

          this.paymentForm.reset({
            caseId: currentCaseId,
            paymentDate: new Date(),
            method: PaymentMethod.Cash,
            amount: null,
            invoiceId: null,
            category: FinanceCategory.Fees,
            notes: ''
          }, { emitEvent: false });
          this.paymentForm.markAsPristine();
          this.paymentForm.markAsUntouched();
        });

        // Load cases, clients, and all invoices
        await Promise.all([
          this.loadCases(),
          this.loadClients(),
          this.loadAllInvoices()
        ]);

        // If case is pre-provided, load its data and set client
        untracked(() => {
          if (currentCaseId) {
            const c = this.cases().find(x => x.id === currentCaseId);
            if (c) {
              this.selectedClientId.set(c.clientId);
            }
            this.loadInvoicesForCase(currentCaseId);
          }
          this.paymentForm.markAsPristine();
          this.paymentForm.markAsUntouched();
        });
      }
    });
  }

  isFieldInvalid(controlName: string): boolean {
    const ctrl = this.paymentForm.get(controlName);
    return !!(ctrl && ctrl.invalid && (this.submitted() || ctrl.touched));
  }

  getSelectedCase() {
    const id = this.paymentForm.get('caseId')?.value;
    return this.cases().find(c => c.id === id);
  }

  async loadAllInvoices() {
    try {
      this.allInvoices.set(await this.financeService.getInvoices());
    } catch (error) {
      console.error('Error loading invoices', error);
    }
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
    
    // If the currently selected case doesn't belong to the new client, clear it
    const currentCase = this.getSelectedCase();
    if (currentCase && currentCase.clientId !== clientId) {
      this.paymentForm.get('caseId')?.setValue(null);
      this.onCaseChange({ value: null });
    }
  }

  async onCaseChange(event: any) {
    const caseId = event.value;
    this.paymentForm.get('invoiceId')?.setValue(null);
    this.selectedInvoice.set(null);
    this.localInvoices.set([]);
    
    if (caseId) {
      await this.loadInvoicesForCase(caseId);
    } else {
      this.caseSummary.set(null);
    }
  }

  private async loadInvoicesForCase(caseId: string) {
    try {
      const data = await this.financeService.getInvoices(caseId);
      this.localInvoices.set(data);
      this.loadSummaryForCase(caseId);
    } catch (error) {
      console.error('Error loading invoices for case', error);
    }
  }

  private async loadSummaryForCase(caseId: string) {
    try {
      this.caseSummary.set(await this.financeService.getCaseSummary(caseId));
    } catch (error) {
      console.error('Error loading summary for case', error);
    }
  }

  onInvoiceChange(event: any) {
    const invoiceId = event.value;
    const inv = this.filteredInvoices().find(i => i.id === invoiceId);
    this.selectedInvoice.set(inv || null);
    
    if (inv) {
      // Pre-set amount to remaining balance, with robust calculation
      const remaining = inv.remainingAmount ?? (inv.amount - inv.paidAmount);
      this.paymentForm.get('amount')?.setValue(remaining);
      if (inv.category !== undefined && inv.category !== null) {
        this.paymentForm.get('category')?.setValue(inv.category);
      }
    }
  }

  async save() {
    this.submitted.set(true);
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const amount = this.paymentForm.get('amount')?.value;
    const inv = this.selectedInvoice();
    const summary = this.caseSummary();

    // Overpayment validation for specific invoice
    const remaining = inv ? (inv.remainingAmount ?? (inv.amount - inv.paidAmount)) : 0;
    if (inv && amount > remaining) {
      this.paymentForm.get('amount')?.setErrors({ overpayment: true });
      return;
    }

    // Overpayment validation for the whole case if no invoice selected
    const totalRemaining = summary ? (summary.totalRemaining ?? (summary.totalInvoiced - summary.totalPaid)) : 0;
    if (!inv && summary && amount > totalRemaining) {
      this.paymentForm.get('amount')?.setErrors({ overpayment: true });
      return;
    }

    this.onSave.emit(this.paymentForm.value);
  }

  close() {
    this.paymentForm.reset({
      caseId: this.caseId(),
      invoiceId: null,
      amount: 0,
      paymentDate: new Date(),
      method: PaymentMethod.Cash,
      notes: ''
    });

    this.selectedInvoice.set(null);
    this.caseSummary.set(null);
    this.localInvoices.set([]);

    this.visible.set(false);
  }
}
