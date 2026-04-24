import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CaseDetailDto, CaseStatus } from '../../../core/services/case.service';
import { ClientService, Client } from '../../../core/services/client';

@Component({
  selector: 'app-case-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule
  ],
  templateUrl: './case-dialog.html'
})
export class CaseDialog implements OnInit {
  @Input() case: CaseDetailDto | null = null;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);

  caseForm = this.fb.group({
    id: [null],
    caseNumber: ['', Validators.required],
    title: ['', Validators.required],
    description: [''],
    status: [CaseStatus.Open, Validators.required],
    startDate: [new Date(), Validators.required],
    closedDate: [null as Date | null],
    notes: [''],
    clientId: [null as string | null, Validators.required],
    assignedLawyerId: [null as string | null, Validators.required]
  });

  clients = signal<Client[]>([]);
  lawyers = signal<any[]>([]); // To be populated
  statuses = [
    { label: 'مفتوحة', value: CaseStatus.Open },
    { label: 'قيد الانتظار', value: CaseStatus.Pending },
    { label: 'مغلقة', value: CaseStatus.Closed }
  ];

  async ngOnInit() {
    await this.loadFormData();
    if (this.case) {
      this.caseForm.patchValue({
        ...this.case,
        startDate: new Date(this.case.startDate),
        closedDate: this.case.closedDate ? new Date(this.case.closedDate) : null
      } as any);
    }
  }

  async loadFormData() {
    try {
      this.clients.set(await this.clientService.getClients());
      // Mocking lawyers for now until backend endpoint is ready
      this.lawyers.set([
        { fullName: 'المحامي المسؤول (Admin)', id: '00000000-0000-0000-0000-000000000000' } 
      ]);
    } catch (error) {
      console.error('Error loading dialog data', error);
    }
  }

  isClosedStatus(): boolean {
    return this.caseForm.get('status')?.value === CaseStatus.Closed;
  }

  save() {
    if (this.caseForm.valid) {
      this.onSave.emit(this.caseForm.value);
    }
  }

  close() {
    this.visibleChange.emit(false);
  }
}
