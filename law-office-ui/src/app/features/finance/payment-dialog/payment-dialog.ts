import { Component, Input, Output, EventEmitter, inject, signal, effect, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CaseService, CaseListDto } from '../../../core/services/case.service';
import { FinanceService, PaymentMethod, InvoiceListDto } from '../../../core/services/finance.service';

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
    DatePickerModule,
    TextareaModule
  ],
  templateUrl: './payment-dialog.html'
})
export class PaymentDialog {
  private fb = inject(FormBuilder);
  private caseService = inject(CaseService);
  private financeService = inject(FinanceService);

  visible = model<boolean>(false);
  @Output() onSave = new EventEmitter<any>();

  paymentForm: FormGroup;
  saving = signal(false);
  cases = signal<CaseListDto[]>([]);
  invoices = signal<InvoiceListDto[]>([]);
  selectedInvoice = signal<InvoiceListDto | null>(null);

  methods = [
    { label: 'نقدي', value: PaymentMethod.Cash },
    { label: 'تحويل بنكي', value: PaymentMethod.BankTransfer },
    { label: 'بطاقة ائتمان', value: PaymentMethod.CreditCard },
    { label: 'شيك', value: PaymentMethod.Check }
  ];

  constructor() {
    this.paymentForm = this.fb.group({
      caseId: [null, Validators.required],
      invoiceId: [null],
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentDate: [new Date(), Validators.required],
      method: [PaymentMethod.Cash, Validators.required],
      notes: ['']
    });

    effect(async () => {
      if (this.visible()) {
        await this.loadCases();
      }
    });

    // Reset when dialog opens/closes
    effect(() => {
      if (this.visible()) {
        this.paymentForm.reset({
          paymentDate: new Date(),
          method: PaymentMethod.Cash,
          amount: 0
        });
        this.invoices.set([]);
        this.selectedInvoice.set(null);
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

  async onCaseChange(event: any) {
    const caseId = event.value;
    this.paymentForm.get('invoiceId')?.setValue(null);
    this.selectedInvoice.set(null);
    
    if (caseId) {
      try {
        const data = await this.financeService.getInvoices(caseId);
        // Only show unpaid or partially paid invoices
        this.invoices.set(data.filter(i => i.status === 0 || i.status === 1 || i.status === 3));
      } catch (error) {
        console.error('Error loading invoices for case', error);
      }
    } else {
      this.invoices.set([]);
    }
  }

  onInvoiceChange(event: any) {
    const invoiceId = event.value;
    const inv = this.invoices().find(i => i.id === invoiceId);
    this.selectedInvoice.set(inv || null);
    
    if (inv) {
      // Pre-set amount to remaining balance
      this.paymentForm.get('amount')?.setValue(inv.remainingAmount);
    }
  }

  async save() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const amount = this.paymentForm.get('amount')?.value;
    const inv = this.selectedInvoice();

    // Overpayment validation
    if (inv && amount > inv.remainingAmount) {
      this.paymentForm.get('amount')?.setErrors({ overpayment: true });
      return;
    }

    this.saving.set(true);
    try {
      this.onSave.emit(this.paymentForm.value);
    } finally {
      this.saving.set(false);
    }
  }

  close() {
    this.visible.set(false);
  }
}
