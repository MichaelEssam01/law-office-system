import { Component, Input, Output, EventEmitter, inject, signal, effect, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CaseService, CaseListDto } from '../../../core/services/case.service';
import { SessionStatus, SessionDetailDto } from '../../../core/services/session.service';

@Component({
  selector: 'app-session-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    TextareaModule
  ],
  templateUrl: './session-dialog.html'
})
export class SessionDialog {
  private fb = inject(FormBuilder);
  private caseService = inject(CaseService);

  visible = model<boolean>(false);
  @Input() session = signal<SessionDetailDto | null>(null);
  @Output() onSave = new EventEmitter<any>();

  sessionForm: FormGroup;
  saving = signal(false);
  cases = signal<CaseListDto[]>([]);

  statuses = [
    { label: 'مجدولة', value: SessionStatus.Scheduled },
    { label: 'مكتملة', value: SessionStatus.Completed },
    { label: 'مؤجلة', value: SessionStatus.Postponed },
    { label: 'ملغاة', value: SessionStatus.Cancelled }
  ];

  constructor() {
    this.sessionForm = this.fb.group({
      id: [null],
      title: ['', Validators.required],
      caseId: [null, Validators.required],
      scheduledAt: [new Date(), Validators.required],
      courtName: ['', Validators.required],
      status: [SessionStatus.Scheduled, Validators.required],
      notes: ['']
    });

    // Effect to load cases when dialog opens
    effect(async () => {
      if (this.visible()) {
        await this.loadCases();
      }
    });

    // Effect to patch form when session changes
    effect(() => {
      const s = this.session();
      if (s) {
        this.sessionForm.patchValue({
          ...s,
          scheduledAt: new Date(s.scheduledAt)
        });
      } else {
        this.sessionForm.reset({
          status: SessionStatus.Scheduled,
          scheduledAt: new Date()
        });
      }
    });
  }

  async loadCases() {
    try {
      const data = await this.caseService.getCases();
      this.cases.set(data);
    } catch (error) {
      console.error('Error loading cases for dialog', error);
    }
  }

  async save() {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      this.onSave.emit(this.sessionForm.value);
    } finally {
      this.saving.set(false);
    }
  }

  close() {
    this.visible.set(false);
  }
}
