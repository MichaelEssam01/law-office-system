import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, inject, signal, effect } from '@angular/core';
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
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { UserManagementService } from '../../../core/services/user-management.service';

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
    DatePickerModule,
    TranslateModule
  ],
  templateUrl: './case-dialog.html'
})
export class CaseDialog implements OnInit, OnChanges {
  @Input() case: CaseDetailDto | null = null;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private translate = inject(TranslateService);
  private userService = inject(UserManagementService);
  public appState = inject(AppStateService);

  caseForm = this.fb.group({
    id: [null],
    caseNumber: [''],
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
  statuses = signal<any[]>([]);

  constructor() {
    effect(() => {
      // Trigger update when language changes
      const lang = this.appState.currentLang();
      this.updateStatusLabels();
    });
  }

  updateStatusLabels() {
    this.statuses.set([
      { labelKey: 'CASES.OPEN', value: CaseStatus.Open },
      { labelKey: 'CASES.PENDING', value: CaseStatus.Pending },
      { labelKey: 'CASES.CLOSED', value: CaseStatus.Closed }
    ]);
  }

  async ngOnInit() {
    this.updateStatusLabels();
    await this.loadFormData();
    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['case'] && !changes['case'].firstChange) {
      this.patchForm();
    }
    
    // Also reset form when opening for a new case
    if (changes['visible'] && changes['visible'].currentValue === true && !this.case) {
      this.patchForm();
    }
  }

  private patchForm() {
    if (this.case) {
      this.caseForm.patchValue({
        ...this.case,
        startDate: new Date(this.case.startDate),
        closedDate: this.case.closedDate ? new Date(this.case.closedDate) : null
      } as any);
    } else {
      this.caseForm.reset({
        status: CaseStatus.Open,
        startDate: new Date()
      });
    }
  }

  async loadFormData() {
    try {
      this.clients.set(await this.clientService.getClients());
      const allLawyers = await this.userService.getLawyers();
      this.lawyers.set(allLawyers);
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
