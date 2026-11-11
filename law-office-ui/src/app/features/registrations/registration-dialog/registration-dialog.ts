import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import {
  RegistrationDetailDto,
  RegistrationRequestType,
  RegistrationProcedureType,
  RegistrationProcedureDto
} from '../../../core/services/registration.service';
import { ClientService, Client } from '../../../core/services/client';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { UserManagementService } from '../../../core/services/user-management.service';
import { AutoSelectFilterDirective } from '../../../core/directives/auto-select-filter.directive';

@Component({
  selector: 'app-registration-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    AutoSelectFilterDirective,
    DatePickerModule,
    TabsModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './registration-dialog.html'
})
export class RegistrationDialog implements OnInit, OnChanges {
  @Input() registration: RegistrationDetailDto | null = null;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private translate = inject(TranslateService);
  private userService = inject(UserManagementService);
  public appState = inject(AppStateService);

  activeTab = signal<number>(0);
  submitted = signal<boolean>(false);

  registrationForm = this.fb.group({
    id: [null as string | null],
    registrationNumber: [''],
    authorityName: ['', Validators.required],
    requestType: [null as RegistrationRequestType | null, Validators.required],
    otherRequestType: [''],
    fileNumber: [''],
    fileYear: [null as Date | null],
    fileColor: [''],
    resultNumber: [''],
    resultDate: [null as Date | null],
    resultAuthority: [''],
    notes: [''],
    clientId: [null as string | null, Validators.required],
    assignedLawyerId: [null as string | null],
    procedures: this.fb.array([])
  });

  clients = signal<Client[]>([]);
  lawyers = signal<any[]>([]);
  requestTypes = signal<any[]>([]);

  RegistrationRequestType = RegistrationRequestType;
  RegistrationProcedureType = RegistrationProcedureType;

  readonly procedureStages = [
    { type: RegistrationProcedureType.Survey, labelKey: 'REGISTRATIONS.PROCEDURES.SURVEY', icon: 'pi pi-map' },
    { type: RegistrationProcedureType.Application, labelKey: 'REGISTRATIONS.PROCEDURES.APPLICATION', icon: 'pi pi-file' },
    { type: RegistrationProcedureType.DraftProject, labelKey: 'REGISTRATIONS.PROCEDURES.DRAFT_PROJECT', icon: 'pi pi-file-edit' },
    { type: RegistrationProcedureType.TechnicalReview, labelKey: 'REGISTRATIONS.PROCEDURES.TECHNICAL_REVIEW', icon: 'pi pi-cog' },
    { type: RegistrationProcedureType.FinancialReview, labelKey: 'REGISTRATIONS.PROCEDURES.FINANCIAL_REVIEW', icon: 'pi pi-wallet' },
    { type: RegistrationProcedureType.Publication, labelKey: 'REGISTRATIONS.PROCEDURES.PUBLICATION', icon: 'pi pi-verified' }
  ];

  constructor() {
    effect(() => {
      const lang = this.appState.currentLang();
      this.translate.get('REGISTRATIONS.TITLE').subscribe(() => {
        this.initOptions();
      });
    });
  }

  async ngOnInit() {
    await Promise.all([this.loadClients(), this.loadLawyers()]);
  }

  get procedures(): FormArray {
    return this.registrationForm.get('procedures') as FormArray;
  }

  initProcedureControls(existingProcedures?: RegistrationProcedureDto[]) {
    this.procedures.clear();
    for (const stage of this.procedureStages) {
      const found = existingProcedures?.find(p => p.procedureType === stage.type);
      this.procedures.push(this.fb.group({
        procedureType: [stage.type],
        startDate: [found?.startDate ? new Date(found.startDate) : null],
        completedWork: [found?.completedWork || ''],
        obstacles: [found?.obstacles || ''],
        requiredAction: [found?.requiredAction || ''],
        responsibleLawyerId: [found?.responsibleLawyerId || null],
        notes: [found?.notes || '']
      }));
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['registration'] || changes['visible']) {
      if (this.visible) {
        this.submitted.set(false);
        this.activeTab.set(0);

        if (this.registration) {
          this.registrationForm.patchValue({
            id: this.registration.id,
            registrationNumber: this.registration.registrationNumber,
            authorityName: this.registration.authorityName,
            requestType: this.registration.requestType,
            otherRequestType: this.registration.otherRequestType || '',
            fileNumber: this.registration.fileNumber || '',
            fileYear: this.registration.fileYear ? new Date(this.registration.fileYear, 0, 1) : null,
            fileColor: this.registration.fileColor || '',
            resultNumber: this.registration.resultNumber || '',
            resultDate: this.registration.resultDate ? new Date(this.registration.resultDate) : null,
            resultAuthority: this.registration.resultAuthority || '',
            notes: this.registration.notes || '',
            clientId: this.registration.clientId,
            assignedLawyerId: this.registration.assignedLawyerId || null
          });
          this.initProcedureControls(this.registration.procedures);
        } else {
          this.registrationForm.reset({
            fileYear: null
          });
          this.initProcedureControls();
        }
      }
    }
  }

  initOptions() {
    this.requestTypes.set([
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.INHERITANCE_PUBLICATION'), value: RegistrationRequestType.InheritancePublication },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.BARE_OWNERSHIP_SALE'), value: RegistrationRequestType.BareOwnershipSale },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.USUFRUCT_SALE'), value: RegistrationRequestType.UsufructSale },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.FULL_OWNERSHIP_SALE'), value: RegistrationRequestType.FullOwnershipSale },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.LEASE'), value: RegistrationRequestType.Lease },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.MORTGAGE'), value: RegistrationRequestType.Mortgage },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.AMICABLE_PARTITION'), value: RegistrationRequestType.AmicablePartition },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.PETITION_PUBLICATION'), value: RegistrationRequestType.PetitionPublication },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.JUDGMENT_PUBLICATION'), value: RegistrationRequestType.JudgmentPublication },
      { label: this.translate.instant('REGISTRATIONS.REQUEST_TYPES.OTHER'), value: RegistrationRequestType.Other }
    ]);
  }

  async loadClients() {
    try {
      this.clients.set(await this.clientService.getClients());
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }

  async loadLawyers() {
    try {
      const users = await this.userService.getUsers();
      this.lawyers.set(users.filter(u => u.role === 'Lawyer' || u.role === 'Admin'));
    } catch (error) {
      console.error('Error loading lawyers:', error);
    }
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  nextTab() {
    if (this.activeTab() < 3) {
      this.activeTab.set(this.activeTab() + 1);
    }
  }

  prevTab() {
    if (this.activeTab() > 0) {
      this.activeTab.set(this.activeTab() - 1);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.registrationForm.get(fieldName);
    return !!(control && control.invalid && (this.submitted() || control.touched));
  }

  hasTabErrors(tabIndex: number): boolean {
    if (tabIndex === 0) {
      const fields = ['authorityName', 'requestType', 'clientId'];
      return fields.some(f => this.isFieldInvalid(f));
    }
    return false;
  }

  save() {
    this.submitted.set(true);
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      if (this.hasTabErrors(0)) {
        this.activeTab.set(0);
      }
      return;
    }

    const raw = this.registrationForm.value;
    const procedures: RegistrationProcedureDto[] = ((raw.procedures as any[]) || [])
      .filter(p => p.startDate || p.completedWork || p.obstacles || p.requiredAction || p.responsibleLawyerId || p.notes)
      .map(p => ({
        procedureType: p.procedureType,
        startDate: p.startDate || null,
        completedWork: p.completedWork || null,
        obstacles: p.obstacles || null,
        requiredAction: p.requiredAction || null,
        responsibleLawyerId: p.responsibleLawyerId || null,
        notes: p.notes || null
      }));

    const payload = {
      id: raw.id,
      registrationNumber: raw.registrationNumber,
      authorityName: raw.authorityName,
      requestType: raw.requestType,
      otherRequestType: raw.requestType === RegistrationRequestType.Other ? raw.otherRequestType : null,
      fileNumber: raw.fileNumber,
      fileYear: raw.fileYear instanceof Date ? raw.fileYear.getFullYear() : (raw.fileYear ? Number(raw.fileYear) : null),
      fileColor: raw.fileColor,
      resultNumber: raw.resultNumber,
      resultDate: raw.resultDate,
      resultAuthority: raw.resultAuthority,
      notes: raw.notes,
      clientId: raw.clientId,
      assignedLawyerId: raw.assignedLawyerId || null,
      procedures
    };

    this.onSave.emit(payload);
  }
}

