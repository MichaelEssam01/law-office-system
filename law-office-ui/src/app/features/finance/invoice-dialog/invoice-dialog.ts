import { Component, Input, Output, EventEmitter, inject, signal, effect, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CaseService, CaseListDto } from '../../../core/services/case.service';
import { InvoiceStatus, InvoiceListDto } from '../../../core/services/finance.service';

@Component({
  selector: 'app-invoice-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule
  ],
  templateUrl: './invoice-dialog.html'
})
export class InvoiceDialog {
  private fb = inject(FormBuilder);
  private caseService = inject(CaseService);

  visible = model<boolean>(false);
  @Input() invoice = signal<InvoiceListDto | null>(null);
  @Output() onSave = new EventEmitter<any>();

  invoiceForm: FormGroup;
  saving = signal(false);
  cases = signal<CaseListDto[]>([]);

  statuses = [
    { label: 'غير مدفوعة', value: InvoiceStatus.Unpaid },
    { label: 'مدفوعة جزئياً', value: InvoiceStatus.PartiallyPaid },
    { label: 'مدفوعة', value: InvoiceStatus.Paid },
    { label: 'متأخرة', value: InvoiceStatus.Overdue },
    { label: 'ملغاة', value: InvoiceStatus.Cancelled }
  ];

  constructor() {
    this.invoiceForm = this.fb.group({
      id: [null],
      caseId: [null, Validators.required],
      invoiceNumber: ['', Validators.required],
      title: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      dueDate: [new Date(), Validators.required],
      status: [InvoiceStatus.Unpaid],
      notes: ['']
    });

    effect(async () => {
      if (this.visible()) {
        await this.loadCases();
      }
    });

    effect(() => {
      const inv = this.invoice();
      if (inv) {
        this.invoiceForm.patchValue({
          ...inv,
          dueDate: new Date(inv.dueDate)
        });
      } else {
        this.invoiceForm.reset({
          status: InvoiceStatus.Unpaid,
          dueDate: new Date(),
          amount: 0
        });
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
