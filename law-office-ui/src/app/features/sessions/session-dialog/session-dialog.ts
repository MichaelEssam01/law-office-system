import { Component, Input, Output, EventEmitter, inject, signal, effect, model, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { CaseService, CaseListDto } from '../../../core/services/case.service';
import { SessionStatus, SessionDetailDto } from '../../../core/services/session.service';
import { UserManagementService } from '../../../core/services/user-management.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { AutoSelectFilterDirective } from '../../../core/directives/auto-select-filter.directive';

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
    AutoSelectFilterDirective,
    DatePickerModule,
    TextareaModule,
    CheckboxModule,
    TranslateModule
  ],
  templateUrl: './session-dialog.html'
})
export class SessionDialog {
  private fb = inject(FormBuilder);
  private caseService = inject(CaseService);
  private userService = inject(UserManagementService);
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);

  visible = model<boolean>(false);
  session = input<SessionDetailDto | null>(null);
  caseId = input<string | null>(null);
  initialMode = input<'edit' | 'outcome'>('edit');
  @Output() onSave = new EventEmitter<any>();

  sessionForm: FormGroup;
  saving = signal(false);
  showOutcomeSection = signal(false);
  cases = signal<CaseListDto[]>([]);
  lawyers = signal<any[]>([]);
  statuses = signal<any[]>([]);
  decisionKeys = signal<any[]>([]);

  constructor() {
    this.updateDropdownLabels();

    this.sessionForm = this.fb.group({
      id: [null],
      title: ['', Validators.required],
      caseId: [null, Validators.required],
      scheduledDate: [new Date(), Validators.required],
      scheduledTime: ['09:00', Validators.required],

      // المحكمة والمكان ورقم الدائرة
      courtName: ['', Validators.required],
      location: [''],
      circuitNumber: [''],

      // الحالة
      status: [SessionStatus.Scheduled, Validators.required],

      // الجلسة الحالية
      currentSessionRole: [''],
      assignedLawyerId: [null],

      // الجلسة السابقة
      previousSessionRole: [''],
      postponementReason: [''],
      previousSessionLawyerId: [null],

      // ما تم في الجلسة
      sessionProceedings: [''],

      // القرار
      decisionKey: [null],
      decisionText: [''],

      notes: ['']
    });

    // Effect to load cases and lawyers when dialog opens
    effect(async () => {
      if (this.visible()) {
        await Promise.all([
          this.loadCases(),
          this.loadLawyers()
        ]);
      }
    });

    // Effect to update labels when language changes
    effect(() => {
      const lang = this.appState.currentLang();
      this.updateDropdownLabels();
    });

    // Effect to patch form when session changes
    effect(() => {
      const s = this.session();
      if (s) {
        const d = new Date(s.scheduledAt);
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        this.sessionForm.patchValue({
          id: s.id,
          title: s.title,
          caseId: s.caseId,
          scheduledDate: d,
          scheduledTime: `${hh}:${mm}`,
          courtName: s.courtName || '',
          location: s.location || '',
          circuitNumber: s.circuitNumber || '',
          status: s.status,
          currentSessionRole: s.currentSessionRole || '',
          assignedLawyerId: s.assignedLawyerId || null,
          previousSessionRole: s.previousSessionRole || '',
          postponementReason: s.postponementReason || '',
          previousSessionLawyerId: s.previousSessionLawyerId || null,
          sessionProceedings: s.sessionProceedings || '',
          decisionKey: s.decisionKey || null,
          decisionText: s.decisionText || '',
          notes: s.notes || ''
        });

        // If editing an existing session, show outcome section by default
        this.showOutcomeSection.set(true);
      } else {
        this.sessionForm.reset({
          id: null,
          title: '',
          caseId: this.caseId(),
          status: SessionStatus.Scheduled,
          scheduledDate: new Date(),
          scheduledTime: '09:00',
          courtName: '',
          location: '',
          circuitNumber: '',
          currentSessionRole: '',
          assignedLawyerId: null,
          previousSessionRole: '',
          postponementReason: '',
          previousSessionLawyerId: null,
          sessionProceedings: '',
          decisionKey: null,
          decisionText: '',
          notes: ''
        });

        // For new sessions, hide outcome/decision by default to keep initial view clean
        this.showOutcomeSection.set(false);
      }
    });
  }

  getSelectedCase() {
    const id = this.sessionForm.get('caseId')?.value;
    return this.cases().find(c => c.id === id);
  }

  updateDropdownLabels() {
    this.statuses.set([
      { labelKey: 'SESSIONS.SCHEDULED', value: SessionStatus.Scheduled },
      { labelKey: 'SESSIONS.COMPLETED', value: SessionStatus.Completed },
      { labelKey: 'SESSIONS.POSTPONED', value: SessionStatus.Postponed },
      { labelKey: 'SESSIONS.RESERVED_FOR_JUDGMENT', value: SessionStatus.ReservedForJudgment },
      { labelKey: 'SESSIONS.CANCELLED', value: SessionStatus.Cancelled }
    ]);

    this.decisionKeys.set([
      { label: this.translate.instant('SESSIONS.DECISION_KEYS.POSTPONED_NOTICE'), value: 'POSTPONED_NOTICE' },
      { label: this.translate.instant('SESSIONS.DECISION_KEYS.POSTPONED_DOCUMENTS'), value: 'POSTPONED_DOCUMENTS' },
      { label: this.translate.instant('SESSIONS.DECISION_KEYS.POSTPONED_PLEADING'), value: 'POSTPONED_PLEADING' },
      { label: this.translate.instant('SESSIONS.DECISION_KEYS.POSTPONED_EXPERT'), value: 'POSTPONED_EXPERT' },
      { label: this.translate.instant('SESSIONS.DECISION_KEYS.RESERVED_JUDGMENT'), value: 'RESERVED_JUDGMENT' },
      { label: this.translate.instant('SESSIONS.DECISION_KEYS.REOPEN_PLEADING'), value: 'REOPEN_PLEADING' },
      { label: this.translate.instant('SESSIONS.DECISION_KEYS.EXTEND_JUDGMENT'), value: 'EXTEND_JUDGMENT' },
      { label: this.translate.instant('SESSIONS.DECISION_KEYS.CASE_STRICKEN'), value: 'CASE_STRICKEN' },
      { label: this.translate.instant('SESSIONS.DECISION_KEYS.FINAL_JUDGMENT'), value: 'FINAL_JUDGMENT' },
      { label: this.translate.instant('SESSIONS.DECISION_KEYS.OTHER'), value: 'OTHER' }
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

  async loadLawyers() {
    try {
      const data = await this.userService.getLawyers();
      this.lawyers.set(data);
    } catch (error) {
      console.error('Error loading lawyers for dialog', error);
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
