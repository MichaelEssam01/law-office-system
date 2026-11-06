import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormArray, Validators, FormGroup } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { 
  CaseDetailDto, 
  CaseStatus, 
  ArchivingType, 
  CaseType, 
  FamilyCaseSubtype, 
  YearType, 
  LitigationDegree, 
  PartyCapacity, 
  DisputeNature, 
  PartyType,
  CasePartyDto
} from '../../../core/services/case.service';
import { ClientService, Client } from '../../../core/services/client';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { UserManagementService } from '../../../core/services/user-management.service';
import { AutoSelectFilterDirective } from '../../../core/directives/auto-select-filter.directive';

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
    InputNumberModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
    AutoSelectFilterDirective,
    DatePickerModule,
    CheckboxModule,
    TabsModule,
    CardModule,
    TooltipModule,
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

  today = new Date();
  activeTab = signal<number>(0);
  submitted = signal<boolean>(false);

  // Form definition
  caseForm = this.fb.group({
    id: [null as string | null],
    caseNumber: [''],
    title: ['', Validators.required], // الموضوع (Subject)
    subject: [''],
    description: [''],
    status: [CaseStatus.InProgress, Validators.required],
    archivingType: [null as ArchivingType | null],

    // Workflow actions (متداولة / معلقة / موقوفة)
    selectedRequiredActions: [[] as string[]],
    officeAction: [''],
    courtAction: [''],
    externalAction: [''],
    otherAction: [''],
    hasOfficeAction: [false],
    hasCourtAction: [false],
    hasExternalAction: [false],
    hasOtherAction: [false],

    // Suspension reason (معلقة / موقوفة)
    selectedSuspensionReasons: [[] as string[]],
    suspensionReason: [''],
    suspensionDocumentsText: [''],
    suspensionOtherText: [''],

    // Dates
    agreementDate: [null as Date | null],
    startDate: [new Date(), Validators.required],
    courtFilingDate: [null as Date | null],
    closedDate: [null as Date | null],

    // Type & Subtype (نوع القضية required)
    caseType: [null as CaseType | null, Validators.required],
    familyCaseSubtype: [null as FamilyCaseSubtype | null],

    // Court Information
    courtCaseNumber: [''],
    yearType: [YearType.Gregorian],
    year: [new Date().getFullYear() as number | null],
    litigationDegree: [null as LitigationDegree | null],

    // Physical File Archive
    fileNumber: [''],
    fileYear: [new Date().getFullYear() as number | null],
    fileColor: [''],

    // Outcome & Notes
    judgmentResult: [''],
    judgmentDate: [null as Date | null],
    notes: [''],

    // Primary Client (required) & Lawyer (not required)
    clientId: [null as string | null, Validators.required],
    assignedLawyerId: [null as string | null],

    // Parties
    clientParties: this.fb.array([]),
    opponentParties: this.fb.array([])
  });

  // Signals for Select Dropdowns
  clients = signal<Client[]>([]);
  lawyers = signal<any[]>([]);
  statuses = signal<any[]>([]);
  archivingTypes = signal<any[]>([]);
  caseTypes = signal<any[]>([]);
  familySubtypes = signal<any[]>([]);
  yearTypes = signal<any[]>([]);
  litigationDegrees = signal<any[]>([]);
  capacities = signal<any[]>([]);
  disputeNatures = signal<any[]>([]);
  requiredActionOptions = signal<any[]>([]);
  suspensionReasons = signal<any[]>([]);

  // Year choices for Gregorian
  gregorianYears: number[] = [];

  constructor() {
    // Populate gregorian years list from current year + 5 down to 1980
    const currYear = new Date().getFullYear();
    for (let y = currYear + 5; y >= 1980; y--) {
      this.gregorianYears.push(y);
    }

    effect(() => {
      // Trigger update on language changes
      const lang = this.appState.currentLang();
      this.initDropdownOptions();
    });
  }

  get clientParties(): FormArray {
    return this.caseForm.get('clientParties') as FormArray;
  }

  get opponentParties(): FormArray {
    return this.caseForm.get('opponentParties') as FormArray;
  }

  initDropdownOptions() {
    this.statuses.set([
      { labelKey: 'CASES.IN_PROGRESS', value: CaseStatus.InProgress },
      { labelKey: 'CASES.PENDING', value: CaseStatus.Pending },
      { labelKey: 'CASES.FINISHED', value: CaseStatus.Finished },
      { labelKey: 'CASES.SUSPENDED', value: CaseStatus.Suspended }
    ]);

    this.archivingTypes.set([
      { labelKey: 'CASES.ARCHIVE_PERMANENT', value: ArchivingType.Permanent },
      { labelKey: 'CASES.ARCHIVE_TEMPORARY', value: ArchivingType.Temporary },
      { labelKey: 'CASES.ARCHIVE_DISPOSED', value: ArchivingType.Disposed }
    ]);

    this.caseTypes.set([
      { labelKey: 'CASES.CASE_TYPES.ADMINISTRATIVE', value: CaseType.Administrative },
      { labelKey: 'CASES.CASE_TYPES.FAMILY', value: CaseType.Family },
      { labelKey: 'CASES.CASE_TYPES.ECONOMIC', value: CaseType.Economic },
      { labelKey: 'CASES.CASE_TYPES.RENTS', value: CaseType.Rents },
      { labelKey: 'CASES.CASE_TYPES.CONSTITUTIONAL', value: CaseType.Constitutional },
      { labelKey: 'CASES.CASE_TYPES.COMMERCIAL', value: CaseType.Commercial },
      { labelKey: 'CASES.CASE_TYPES.COMPENSATION', value: CaseType.Compensation },
      { labelKey: 'CASES.CASE_TYPES.ENFORCEMENT', value: CaseType.Enforcement },
      { labelKey: 'CASES.CASE_TYPES.SIGNATURE_VALIDITY', value: CaseType.SignatureValidity },
      { labelKey: 'CASES.CASE_TYPES.LABOR', value: CaseType.Labor },
      { labelKey: 'CASES.CASE_TYPES.CIVIL', value: CaseType.Civil },
      { labelKey: 'CASES.CASE_TYPES.CIVIL_APPEALED', value: CaseType.CivilAppealed },
      { labelKey: 'CASES.CASE_TYPES.URGENT', value: CaseType.Urgent },
      { labelKey: 'CASES.CASE_TYPES.CRIMINAL', value: CaseType.Criminal },
      { labelKey: 'CASES.CASE_TYPES.OTHER', value: CaseType.Other }
    ]);

    this.familySubtypes.set([
      { labelKey: 'CASES.FAMILY_SUBTYPES.FINANCIAL', value: FamilyCaseSubtype.Financial },
      { labelKey: 'CASES.FAMILY_SUBTYPES.MISCELLANEOUS', value: FamilyCaseSubtype.Miscellaneous },
      { labelKey: 'CASES.FAMILY_SUBTYPES.IMPRISONMENT', value: FamilyCaseSubtype.Imprisonment },
      { labelKey: 'CASES.FAMILY_SUBTYPES.INHERITANCE', value: FamilyCaseSubtype.Inheritance }
    ]);

    this.yearTypes.set([
      { labelKey: 'CASES.YEAR_GREGORIAN', value: YearType.Gregorian },
      { labelKey: 'CASES.YEAR_JUDICIAL', value: YearType.Judicial }
    ]);

    // Requested order: جزئي - ابتدائي - استئناف - نقض - ادارية - قضاء اداري - ادارية عليا - دستورية - اخرى
    this.litigationDegrees.set([
      { labelKey: 'CASES.LITIGATION_DEGREES.SUMMARY', value: LitigationDegree.Summary },
      { labelKey: 'CASES.LITIGATION_DEGREES.FIRST_INSTANCE', value: LitigationDegree.FirstInstance },
      { labelKey: 'CASES.LITIGATION_DEGREES.APPELLATE', value: LitigationDegree.Appellate },
      { labelKey: 'CASES.LITIGATION_DEGREES.CASSATION', value: LitigationDegree.Cassation },
      { labelKey: 'CASES.LITIGATION_DEGREES.ADMINISTRATIVE_COURT', value: LitigationDegree.AdministrativeCourt },
      { labelKey: 'CASES.LITIGATION_DEGREES.STATE_COUNCIL', value: LitigationDegree.StateCouncil },
      { labelKey: 'CASES.LITIGATION_DEGREES.SUPREME', value: LitigationDegree.Supreme },
      { labelKey: 'CASES.LITIGATION_DEGREES.CONSTITUTIONAL', value: LitigationDegree.Constitutional },
      { labelKey: 'CASES.LITIGATION_DEGREES.OTHER', value: LitigationDegree.Other }
    ]);

    this.capacities.set([
      { labelKey: 'CASES.CAPACITIES.PLAINTIFF', value: PartyCapacity.Plaintiff },
      { labelKey: 'CASES.CAPACITIES.DEFENDANT', value: PartyCapacity.Defendant },
      { labelKey: 'CASES.CAPACITIES.OFFENSIVE_INTERVENER', value: PartyCapacity.OffensiveIntervener },
      { labelKey: 'CASES.CAPACITIES.ADHESIVE_INTERVENER', value: PartyCapacity.AdhesiveIntervener },
      { labelKey: 'CASES.CAPACITIES.JOINED_PARTY', value: PartyCapacity.JoinedParty },
      { labelKey: 'CASES.CAPACITIES.APPELLANT', value: PartyCapacity.Appellant },
      { labelKey: 'CASES.CAPACITIES.APPELLEE', value: PartyCapacity.Appellee },
      { labelKey: 'CASES.CAPACITIES.CHALLENGER', value: PartyCapacity.Challenger },
      { labelKey: 'CASES.CAPACITIES.RESPONDENT', value: PartyCapacity.Respondent },
      { labelKey: 'CASES.CAPACITIES.VICTIM', value: PartyCapacity.Victim },
      { labelKey: 'CASES.CAPACITIES.ACCUSED', value: PartyCapacity.Accused },
      { labelKey: 'CASES.CAPACITIES.CIVIL_RIGHT_PLAINTIFF', value: PartyCapacity.CivilRightPlaintiff },
      { labelKey: 'CASES.CAPACITIES.OTHER', value: PartyCapacity.Other }
    ]);

    this.disputeNatures.set([
      { labelKey: 'CASES.DISPUTE_ORIGINAL', value: DisputeNature.Original },
      { labelKey: 'CASES.DISPUTE_CONFRONTATIONAL', value: DisputeNature.Confrontational }
    ]);

    this.requiredActionOptions.set([
      { labelKey: 'CASES.ACTION_OFFICE', value: 'office' },
      { labelKey: 'CASES.ACTION_COURT', value: 'court' },
      { labelKey: 'CASES.ACTION_EXTERNAL', value: 'external' },
      { labelKey: 'CASES.ACTION_OTHER', value: 'other' }
    ]);

    this.suspensionReasons.set([
      { labelKey: 'CASES.REASONS.LATE_FEES', value: 'أتعاب متأخرة' },
      { labelKey: 'CASES.REASONS.POA', value: 'توكيل' },
      { labelKey: 'CASES.REASONS.DOCUMENTS', value: 'مستندات' },
      { labelKey: 'CASES.REASONS.OTHER', value: 'أخرى' }
    ]);
  }

  async ngOnInit() {
    this.initDropdownOptions();
    await this.loadFormData();
    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['case'] && !changes['case'].firstChange) {
      this.patchForm();
    }
    
    if (changes['visible'] && changes['visible'].currentValue === true && !this.case) {
      this.patchForm();
    }
  }

  createClientPartyForm(party?: Partial<CasePartyDto>): FormGroup {
    const extraPersonsArray = this.fb.array<FormGroup>([]);

    if (party?.otherPersonName) {
      try {
        const parsed = JSON.parse(party.otherPersonName);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((item: any) => {
            extraPersonsArray.push(this.fb.group({
              name: [item.name || ''],
              lawyer: [item.lawyer || '']
            }));
          });
        } else {
          extraPersonsArray.push(this.fb.group({
            name: [party.otherPersonName || ''],
            lawyer: [party.otherLawyerName || '']
          }));
        }
      } catch {
        extraPersonsArray.push(this.fb.group({
          name: [party.otherPersonName || ''],
          lawyer: [party.otherLawyerName || '']
        }));
      }
    }

    if (extraPersonsArray.length === 0 && party?.hasSameCapacityOthers) {
      extraPersonsArray.push(this.fb.group({
        name: [''],
        lawyer: ['']
      }));
    }

    return this.fb.group({
      id: [party?.id || null],
      partyType: [PartyType.Client],
      clientId: [party?.clientId || null, Validators.required],
      name: [party?.name || ''],
      capacity: [party?.capacity ?? PartyCapacity.Plaintiff, Validators.required],
      disputeNature: [party?.disputeNature ?? DisputeNature.Original, Validators.required],
      hasSameCapacityOthers: [party?.hasSameCapacityOthers ?? false],
      otherPersons: extraPersonsArray
    });
  }

  getOtherPersonsArray(clientPartyIndex: number): FormArray {
    return this.clientParties.at(clientPartyIndex).get('otherPersons') as FormArray;
  }

  addOtherPersonToClient(clientPartyIndex: number) {
    this.getOtherPersonsArray(clientPartyIndex).push(this.fb.group({
      name: [''],
      lawyer: ['']
    }));
  }

  removeOtherPersonFromClient(clientPartyIndex: number, personIndex: number) {
    this.getOtherPersonsArray(clientPartyIndex).removeAt(personIndex);
  }

  onToggleSameCapacity(clientPartyIndex: number) {
    const partyGroup = this.clientParties.at(clientPartyIndex);
    const checked = partyGroup.get('hasSameCapacityOthers')?.value;
    const arr = this.getOtherPersonsArray(clientPartyIndex);
    if (checked && arr.length === 0) {
      arr.push(this.fb.group({
        name: [''],
        lawyer: ['']
      }));
    }
  }

  createOpponentPartyForm(party?: Partial<CasePartyDto>): FormGroup {
    return this.fb.group({
      id: [party?.id || null],
      partyType: [PartyType.Opponent],
      clientId: [null],
      name: [party?.name || '', Validators.required],
      capacity: [party?.capacity ?? PartyCapacity.Defendant, Validators.required],
      disputeNature: [party?.disputeNature ?? DisputeNature.Original, Validators.required],
      hasSameCapacityOthers: [false],
      otherPersonName: [''],
      otherLawyerName: [''],
      opponentLawyerName: [party?.opponentLawyerName || '']
    });
  }

  addClientParty() {
    this.clientParties.push(this.createClientPartyForm());
  }

  removeClientParty(index: number) {
    this.clientParties.removeAt(index);
  }

  addOpponentParty() {
    this.opponentParties.push(this.createOpponentPartyForm());
  }

  removeOpponentParty(index: number) {
    this.opponentParties.removeAt(index);
  }

  onClientSelectForParty(event: any, index: number) {
    const selectedClientId = event.value;
    const client = this.clients().find(c => c.id === selectedClientId);
    if (client) {
      this.clientParties.at(index).patchValue({
        name: client.fullName
      });
    }
  }

  private patchForm() {
    this.activeTab.set(0);
    this.submitted.set(false);
    this.clientParties.clear();
    this.opponentParties.clear();

    if (this.case) {
      const selectedActions: string[] = [];
      if (this.case.hasOfficeAction || this.case.officeAction) selectedActions.push('office');
      if (this.case.hasCourtAction || this.case.courtAction) selectedActions.push('court');
      if (this.case.hasExternalAction || this.case.externalAction) selectedActions.push('external');
      if (this.case.hasOtherAction || this.case.otherAction) selectedActions.push('other');

      let selectedReasons: string[] = [];
      if (this.case.status === CaseStatus.Pending && this.case.suspensionReason) {
        selectedReasons = Array.from(new Set(
          this.case.suspensionReason
            .split(/[,،]/)
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => (s === 'أتعاب' || s === 'متأخرة') ? 'أتعاب متأخرة' : s)
        ));
      }

      this.caseForm.patchValue({
        id: this.case.id,
        caseNumber: this.case.caseNumber,
        title: this.case.title,
        subject: this.case.subject || this.case.title,
        description: this.case.description || '',
        status: this.case.status,
        archivingType: this.case.archivingType ?? null,

        // Actions
        selectedRequiredActions: selectedActions,
        officeAction: this.case.officeAction || '',
        courtAction: this.case.courtAction || '',
        externalAction: this.case.externalAction || '',
        otherAction: this.case.otherAction || '',
        hasOfficeAction: selectedActions.includes('office'),
        hasCourtAction: selectedActions.includes('court'),
        hasExternalAction: selectedActions.includes('external'),
        hasOtherAction: selectedActions.includes('other'),

        // Suspension
        selectedSuspensionReasons: selectedReasons,
        suspensionReason: this.case.suspensionReason || '',
        suspensionDocumentsText: this.case.suspensionDocumentsText || '',
        suspensionOtherText: this.case.suspensionOtherText || '',

        // Dates
        agreementDate: this.case.agreementDate ? new Date(this.case.agreementDate) : null,
        startDate: this.case.startDate ? new Date(this.case.startDate) : new Date(),
        courtFilingDate: this.case.courtFilingDate ? new Date(this.case.courtFilingDate) : null,
        closedDate: this.case.closedDate ? new Date(this.case.closedDate) : null,

        caseType: this.case.caseType ?? null,
        familyCaseSubtype: this.case.familyCaseSubtype ?? null,
        courtCaseNumber: this.case.courtCaseNumber || '',
        yearType: this.case.yearType ?? YearType.Gregorian,
        year: this.case.year ?? new Date().getFullYear(),
        litigationDegree: this.case.litigationDegree ?? null,
        fileNumber: this.case.fileNumber || '',
        fileYear: this.case.fileYear ?? new Date().getFullYear(),
        fileColor: this.case.fileColor || '',
        judgmentResult: this.case.judgmentResult || '',
        judgmentDate: this.case.judgmentDate ? new Date(this.case.judgmentDate) : null,
        notes: this.case.notes || '',
        clientId: this.case.clientId,
        assignedLawyerId: this.case.assignedLawyerId || null
      });

      if (this.case.parties && this.case.parties.length > 0) {
        this.case.parties.forEach(p => {
          if (p.partyType === PartyType.Client) {
            this.clientParties.push(this.createClientPartyForm(p));
          } else {
            this.opponentParties.push(this.createOpponentPartyForm(p));
          }
        });
      }
    } else {
      this.caseForm.reset({
        status: CaseStatus.InProgress,
        startDate: new Date(),
        yearType: YearType.Gregorian,
        year: new Date().getFullYear(),
        fileYear: new Date().getFullYear(),
        selectedRequiredActions: [],
        selectedSuspensionReasons: [],
        hasOfficeAction: false,
        hasCourtAction: false,
        hasExternalAction: false,
        hasOtherAction: false
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

  isInProgressStatus(): boolean {
    return this.caseForm.get('status')?.value === CaseStatus.InProgress;
  }

  isPendingStatus(): boolean {
    return this.caseForm.get('status')?.value === CaseStatus.Pending;
  }

  isFinishedStatus(): boolean {
    return this.caseForm.get('status')?.value === CaseStatus.Finished;
  }

  isSuspendedStatus(): boolean {
    return this.caseForm.get('status')?.value === CaseStatus.Suspended;
  }

  isActionSelected(actionKey: string): boolean {
    const selected: string[] = this.caseForm.get('selectedRequiredActions')?.value || [];
    return selected.includes(actionKey);
  }

  onRequiredActionsChange() {
    const selected: string[] = this.caseForm.get('selectedRequiredActions')?.value || [];
    this.caseForm.patchValue({
      hasOfficeAction: selected.includes('office'),
      hasCourtAction: selected.includes('court'),
      hasExternalAction: selected.includes('external'),
      hasOtherAction: selected.includes('other')
    }, { emitEvent: false });
  }

  isDocumentsSuspension(): boolean {
    const selected: string[] = this.caseForm.get('selectedSuspensionReasons')?.value || [];
    return selected.includes('مستندات') || selected.includes('DOCUMENTS');
  }

  isOtherSuspension(): boolean {
    const selected: string[] = this.caseForm.get('selectedSuspensionReasons')?.value || [];
    return selected.includes('أخرى') || selected.includes('OTHER');
  }

  isFamilyType(): boolean {
    return this.caseForm.get('caseType')?.value === CaseType.Family;
  }

  isJudicialYear(): boolean {
    return this.caseForm.get('yearType')?.value === YearType.Judicial;
  }

  nextTab() {
    if (this.activeTab() < 4) {
      this.activeTab.set(this.activeTab() + 1);
    }
  }

  prevTab() {
    if (this.activeTab() > 0) {
      this.activeTab.set(this.activeTab() - 1);
    }
  }

  hasTab0Errors(): boolean {
    const fields = ['title', 'status', 'startDate', 'caseType', 'clientId'];
    return fields.some(f => this.isFieldInvalid(f));
  }

  hasTab2Errors(): boolean {
    const clientErr = this.clientParties.invalid && (this.submitted() || this.clientParties.touched);
    const oppErr = this.opponentParties.invalid && (this.submitted() || this.opponentParties.touched);
    return clientErr || oppErr;
  }

  isFieldInvalid(controlName: string): boolean {
    const ctrl = this.caseForm.get(controlName);
    return !!(ctrl && ctrl.invalid && (this.submitted() || ctrl.touched));
  }

  isPartyFieldInvalid(group: any, controlName: string): boolean {
    const ctrl = group?.get?.(controlName);
    return !!(ctrl && ctrl.invalid && (this.submitted() || ctrl.touched));
  }

  save() {
    this.submitted.set(true);
    if (this.caseForm.invalid) {
      this.caseForm.markAllAsTouched();
      if (this.hasTab0Errors()) {
        this.activeTab.set(0);
      } else if (this.hasTab2Errors()) {
        this.activeTab.set(2);
      }
      return;
    }

    const val = this.caseForm.value;

    // Process client parties
    const processedClientParties: CasePartyDto[] = this.clientParties.controls.map(control => {
      const cp = control.value;
      let otherPersonName: string | null = null;
      let otherLawyerName: string | null = null;

      if (cp.hasSameCapacityOthers && cp.otherPersons && cp.otherPersons.length > 0) {
        const validPersons = cp.otherPersons.filter((p: any) => p.name && p.name.trim().length > 0);
        if (validPersons.length > 0) {
          otherPersonName = JSON.stringify(validPersons);
          otherLawyerName = validPersons[0]?.lawyer || null;
        }
      }

      return {
        id: cp.id,
        partyType: PartyType.Client,
        clientId: cp.clientId,
        name: cp.name,
        capacity: cp.capacity,
        disputeNature: cp.disputeNature,
        hasSameCapacityOthers: cp.hasSameCapacityOthers,
        otherPersonName: otherPersonName,
        otherLawyerName: otherLawyerName
      };
    });

    // Process opponent parties
    const processedOpponentParties: CasePartyDto[] = this.opponentParties.controls.map(control => {
      const opp = control.value;
      return {
        id: opp.id,
        partyType: PartyType.Opponent,
        clientId: null,
        name: opp.name,
        capacity: opp.capacity,
        disputeNature: opp.disputeNature,
        hasSameCapacityOthers: false,
        otherPersonName: null,
        otherLawyerName: null,
        opponentLawyerName: opp.opponentLawyerName || null
      };
    });

    const allParties: CasePartyDto[] = [
      ...processedClientParties,
      ...processedOpponentParties
    ];

    // Ensure primary client is synchronized
    let primaryClientId = val.clientId;
    if (!primaryClientId && this.clientParties.length > 0) {
      primaryClientId = this.clientParties.at(0).get('clientId')?.value;
    }

    const selectedActions: string[] = val.selectedRequiredActions || [];
    const hasOfficeAction = selectedActions.includes('office');
    const hasCourtAction = selectedActions.includes('court');
    const hasExternalAction = selectedActions.includes('external');
    const hasOtherAction = selectedActions.includes('other');

    const officeAction = hasOfficeAction ? (val.officeAction || '') : '';
    const courtAction = hasCourtAction ? (val.courtAction || '') : '';
    const externalAction = hasExternalAction ? (val.externalAction || '') : '';
    const otherAction = hasOtherAction ? (val.otherAction || '') : '';

    let suspensionReason = val.suspensionReason || '';
    if (val.status === CaseStatus.Pending) {
      const selectedReasons: string[] = val.selectedSuspensionReasons || [];
      suspensionReason = selectedReasons.join('، ');
    }

    const payload = {
      ...val,
      hasOfficeAction,
      hasCourtAction,
      hasExternalAction,
      hasOtherAction,
      officeAction,
      courtAction,
      externalAction,
      otherAction,
      suspensionReason,
      suspensionDocumentsText: this.isDocumentsSuspension() ? (val.suspensionDocumentsText || '') : '',
      suspensionOtherText: this.isOtherSuspension() ? (val.suspensionOtherText || '') : '',
      description: val.description || '',
      clientId: primaryClientId,
      subject: val.title, // 'الموضوع'
      parties: allParties
    };

    this.onSave.emit(payload);
  }

  close() {
    this.visibleChange.emit(false);
  }
}
