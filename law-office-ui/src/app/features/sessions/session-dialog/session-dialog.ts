import { Component, Input, Output, EventEmitter, inject, signal, effect, model, input } from '@angular/core';
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
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';

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
    TextareaModule,
    TranslateModule
  ],
  templateUrl: './session-dialog.html'
})
export class SessionDialog {
  private fb = inject(FormBuilder);
  private caseService = inject(CaseService);
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);

  visible = model<boolean>(false);
  session = input<SessionDetailDto | null>(null);
  caseId = input<string | null>(null);
  @Output() onSave = new EventEmitter<any>();

  sessionForm: FormGroup;
  saving = signal(false);
  cases = signal<CaseListDto[]>([]);
  statuses = signal<any[]>([]);

  constructor() {
    this.updateStatusLabels();
    this.sessionForm = this.fb.group({
      id: [null],
      title: ['', Validators.required],
      caseId: [null, Validators.required],
      scheduledDate: [new Date(), Validators.required],
      scheduledTime: ['09:00', Validators.required],
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

    // Effect to update labels when language changes
    effect(() => {
      const lang = this.appState.currentLang();
      this.updateStatusLabels();
    });

    // Effect to patch form when session changes
    effect(() => {
      const s = this.session();
      if (s) {
        const d = new Date(s.scheduledAt);
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        this.sessionForm.patchValue({
          ...s,
          scheduledDate: d,
          scheduledTime: `${hh}:${mm}`
        });
      } else {
        this.sessionForm.reset({
          caseId: this.caseId(),
          status: SessionStatus.Scheduled,
          scheduledDate: new Date(),
          scheduledTime: '09:00'
        });
      }
    });
  }

  getSelectedCase() {
    const id = this.sessionForm.get('caseId')?.value;
    return this.cases().find(c => c.id === id);
  }

  updateStatusLabels() {
    this.statuses.set([
      { label: this.translate.instant('SESSIONS.SCHEDULED'), value: SessionStatus.Scheduled },
      { label: this.translate.instant('SESSIONS.COMPLETED'), value: SessionStatus.Completed },
      { label: this.translate.instant('SESSIONS.POSTPONED'), value: SessionStatus.Postponed },
      { label: this.translate.instant('SESSIONS.CANCELLED'), value: SessionStatus.Cancelled }
    ]);
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
      const formVal = this.sessionForm.value;
      const date: Date = new Date(formVal.scheduledDate);
      const [hours, minutes] = (formVal.scheduledTime || '00:00').split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      this.onSave.emit({ ...formVal, scheduledAt: date });
    } finally {
      this.saving.set(false);
    }
  }

  close() {
    this.visible.set(false);
  }
}
