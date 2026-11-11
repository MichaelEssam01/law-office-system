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
import { CheckboxModule } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import {
  CompanyDetailDto,
  CompanyStatus,
  CompanyType,
  CompanyPartyDto
} from '../../../core/services/company.service';
import { PartyCapacity, DisputeNature, PartyType } from '../../../core/services/case.service';
import { ClientService, Client } from '../../../core/services/client';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { UserManagementService } from '../../../core/services/user-management.service';
import { AutoSelectFilterDirective } from '../../../core/directives/auto-select-filter.directive';

@Component({
  selector: 'app-company-dialog',
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
    CheckboxModule,
    TabsModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './company-dialog.html'
})
export class CompanyDialog implements OnInit, OnChanges {
  @Input() company: CompanyDetailDto | null = null;
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

  companyForm = this.fb.group({
    id: [null as string | null],
    companyCode: [''],
    title: ['', Validators.required],
    status: [CompanyStatus.Active, Validators.required],
    agreementDate: [null as Date | null],
    startDate: [null as Date | null, Validators.required],
    filingDate: [null as Date | null],
    closedDate: [null as Date | null],
    companyType: [null as CompanyType | null, Validators.required],
    otherCompanyType: [''],
    companyNumber: [''],
    companyDuration: [''],
    authorityDetails: [''],
    fileNumber: [''],
    fileYear: [null as Date | null],
    fileColor: [''],
    contractProcedure: [''],
    registryProcedure: [''],
    registrationPlace: [''],
    subsequentProcedures: [''],
    taxNumber: [''],
    valueAddedTax: [''],
    result: [''],
    notes: [''],
    clientId: [null as string | null, Validators.required],
    assignedLawyerId: [null as string | null],
    clientParties: this.fb.array([]),
    opponentParties: this.fb.array([])
  });

  clients = signal<Client[]>([]);
  lawyers = signal<any[]>([]);
  statuses = signal<any[]>([]);
  companyTypes = signal<any[]>([]);
  partyCapacities = signal<any[]>([]);
  disputeNatures = signal<any[]>([]);

  CompanyStatus = CompanyStatus;
  CompanyType = CompanyType;

  constructor() {
    effect(() => {
      const lang = this.appState.currentLang();
      this.translate.get('COMPANIES.TITLE').subscribe(() => {
        this.initOptions();
      });
    });
  }

  async ngOnInit() {
    await Promise.all([this.loadClients(), this.loadLawyers()]);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['company'] || changes['visible']) {
      if (this.visible) {
        this.submitted.set(false);
        this.activeTab.set(0);
        this.clientParties.clear();
        this.opponentParties.clear();

        if (this.company) {
          this.companyForm.patchValue({
            id: this.company.id,
            companyCode: this.company.companyCode,
            title: this.company.title,
            status: this.company.status,
            agreementDate: this.company.agreementDate ? new Date(this.company.agreementDate) : null,
            startDate: this.company.startDate ? new Date(this.company.startDate) : null,
            filingDate: this.company.filingDate ? new Date(this.company.filingDate) : null,
            closedDate: this.company.closedDate ? new Date(this.company.closedDate) : null,
            companyType: this.company.companyType,
            otherCompanyType: this.company.otherCompanyType || '',
            companyNumber: this.company.companyNumber || '',
            companyDuration: this.company.companyDuration || '',
            authorityDetails: this.company.authorityDetails || '',
            fileNumber: this.company.fileNumber || '',
            fileYear: this.company.fileYear ? new Date(this.company.fileYear, 0, 1) : null,
            fileColor: this.company.fileColor || '',
            contractProcedure: this.company.contractProcedure || '',
            registryProcedure: this.company.registryProcedure || '',
            registrationPlace: this.company.registrationPlace || '',
            subsequentProcedures: this.company.subsequentProcedures || '',
            taxNumber: this.company.taxNumber || '',
            valueAddedTax: this.company.valueAddedTax || '',
            result: this.company.result || '',
            notes: this.company.notes || '',
            clientId: this.company.clientId,
            assignedLawyerId: this.company.assignedLawyerId || null
          });

          if (this.company.parties && this.company.parties.length > 0) {
            for (const p of this.company.parties) {
              if (p.partyType === PartyType.Client) {
                this.addClientParty(p);
              } else {
                this.addOpponentParty(p);
              }
            }
          }
        } else {
          this.companyForm.reset({
            status: CompanyStatus.Active,
            startDate: null,
            fileYear: null
          });
        }
      }
    }
  }

  initOptions() {
    this.statuses.set([
      { label: this.translate.instant('COMPANIES.ACTIVE'), value: CompanyStatus.Active },
      { label: this.translate.instant('COMPANIES.FINISHED'), value: CompanyStatus.Finished }
    ]);

    this.companyTypes.set([
      { label: this.translate.instant('COMPANIES.TYPES.GENERAL_PARTNERSHIP'), value: CompanyType.GeneralPartnership },
      { label: this.translate.instant('COMPANIES.TYPES.LIMITED_PARTNERSHIP'), value: CompanyType.LimitedPartnership },
      { label: this.translate.instant('COMPANIES.TYPES.PARTNERSHIP_LIMITED_BY_SHARES'), value: CompanyType.PartnershipLimitedByShares },
      { label: this.translate.instant('COMPANIES.TYPES.LIMITED_LIABILITY'), value: CompanyType.LimitedLiability },
      { label: this.translate.instant('COMPANIES.TYPES.JOINT_STOCK'), value: CompanyType.JointStock },
      { label: this.translate.instant('COMPANIES.TYPES.DE_FACTO'), value: CompanyType.DeFacto },
      { label: this.translate.instant('COMPANIES.TYPES.OTHER'), value: CompanyType.Other }
    ]);

    this.partyCapacities.set([
      { label: this.translate.instant('CASES.CAPACITIES.PLAINTIFF'), value: PartyCapacity.Plaintiff },
      { label: this.translate.instant('CASES.CAPACITIES.DEFENDANT'), value: PartyCapacity.Defendant },
      { label: this.translate.instant('CASES.CAPACITIES.OFFENSIVE_INTERVENER'), value: PartyCapacity.OffensiveIntervener },
      { label: this.translate.instant('CASES.CAPACITIES.ADHESIVE_INTERVENER'), value: PartyCapacity.AdhesiveIntervener },
      { label: this.translate.instant('CASES.CAPACITIES.JOINED_PARTY'), value: PartyCapacity.JoinedParty },
      { label: this.translate.instant('CASES.CAPACITIES.APPELLANT'), value: PartyCapacity.Appellant },
      { label: this.translate.instant('CASES.CAPACITIES.APPELLEE'), value: PartyCapacity.Appellee },
      { label: this.translate.instant('CASES.CAPACITIES.CHALLENGER'), value: PartyCapacity.Challenger },
      { label: this.translate.instant('CASES.CAPACITIES.RESPONDENT'), value: PartyCapacity.Respondent },
      { label: this.translate.instant('CASES.CAPACITIES.VICTIM'), value: PartyCapacity.Victim },
      { label: this.translate.instant('CASES.CAPACITIES.ACCUSED'), value: PartyCapacity.Accused },
      { label: this.translate.instant('CASES.CAPACITIES.CIVIL_RIGHT_PLAINTIFF'), value: PartyCapacity.CivilRightPlaintiff },
      { label: this.translate.instant('CASES.CAPACITIES.OTHER'), value: PartyCapacity.Other }
    ]);

    this.disputeNatures.set([
      { label: this.translate.instant('CASES.DISPUTE_ORIGINAL'), value: DisputeNature.Original },
      { label: this.translate.instant('CASES.DISPUTE_CONFRONTATIONAL'), value: DisputeNature.Confrontational }
    ]);
  }

  get clientParties(): FormArray {
    return this.companyForm.get('clientParties') as FormArray;
  }

  get opponentParties(): FormArray {
    return this.companyForm.get('opponentParties') as FormArray;
  }

  addClientParty(data?: CompanyPartyDto) {
    let otherPersons: { personName: string; lawyerName: string }[] = [];
    if (data?.otherPersonName) {
      try {
        const parsed = JSON.parse(data.otherPersonName);
        if (Array.isArray(parsed)) otherPersons = parsed;
      } catch {
        otherPersons = [{ personName: data.otherPersonName, lawyerName: data.otherLawyerName || '' }];
      }
    }
    const othersArray = this.fb.array(
      otherPersons.map(o => this.fb.group({
        personName: [o.personName || ''],
        lawyerName: [o.lawyerName || '']
      }))
    );

    const group = this.fb.group({
      clientId: [data?.clientId || null, Validators.required],
      name: [data?.name || ''],
      capacity: [data?.capacity ?? PartyCapacity.Plaintiff, Validators.required],
      disputeNature: [data?.disputeNature ?? DisputeNature.Original, Validators.required],
      hasSameCapacityOthers: [data?.hasSameCapacityOthers || false],
      otherPersons: othersArray
    });

    if (data?.hasSameCapacityOthers && othersArray.length === 0) {
      this.addOtherPersonToParty(group);
    }
    this.clientParties.push(group);
  }

  removeClientParty(index: number) {
    this.clientParties.removeAt(index);
  }

  getOtherPersonsArray(partyGroup: any): FormArray {
    return partyGroup.get('otherPersons') as FormArray;
  }

  onSameCapacityOthersChange(partyGroup: any, checked: boolean) {
    const arr = this.getOtherPersonsArray(partyGroup);
    if (checked && arr.length === 0) {
      this.addOtherPersonToParty(partyGroup);
    }
  }

  addOtherPersonToParty(partyGroup: any) {
    const arr = this.getOtherPersonsArray(partyGroup);
    arr.push(this.fb.group({
      personName: [''],
      lawyerName: ['']
    }));
  }

  removeOtherPersonFromParty(partyGroup: any, index: number) {
    const arr = this.getOtherPersonsArray(partyGroup);
    arr.removeAt(index);
  }

  addOpponentParty(data?: CompanyPartyDto) {
    const group = this.fb.group({
      name: [data?.name || '', Validators.required],
      capacity: [data?.capacity ?? PartyCapacity.Defendant, Validators.required],
      disputeNature: [data?.disputeNature ?? DisputeNature.Original, Validators.required],
      opponentLawyerName: [data?.opponentLawyerName || '']
    });
    this.opponentParties.push(group);
  }

  removeOpponentParty(index: number) {
    this.opponentParties.removeAt(index);
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
    if (this.activeTab() < 4) {
      this.activeTab.set(this.activeTab() + 1);
    }
  }

  prevTab() {
    if (this.activeTab() > 0) {
      this.activeTab.set(this.activeTab() - 1);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.companyForm.get(fieldName);
    return !!(control && control.invalid && (this.submitted() || control.touched));
  }

  isPartyFieldInvalid(group: any, controlName: string): boolean {
    const ctrl = group?.get?.(controlName);
    return !!(ctrl && ctrl.invalid && (this.submitted() || ctrl.touched));
  }

  hasTabErrors(tabIndex: number): boolean {
    if (tabIndex === 0) {
      const fields = ['title', 'status', 'startDate', 'companyType', 'clientId'];
      return fields.some(f => this.isFieldInvalid(f));
    }
    if (tabIndex === 2) {
      const clientErr = this.clientParties.invalid && (this.submitted() || this.clientParties.touched);
      const oppErr = this.opponentParties.invalid && (this.submitted() || this.opponentParties.touched);
      return clientErr || oppErr;
    }
    return false;
  }

  save() {
    this.submitted.set(true);
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      if (this.hasTabErrors(0)) {
        this.activeTab.set(0);
      } else if (this.hasTabErrors(2)) {
        this.activeTab.set(2);
      }
      return;
    }

    const raw = this.companyForm.value;
    const parties: CompanyPartyDto[] = [];

    for (const cp of (raw.clientParties as any[]) || []) {
      const selectedClient = this.clients().find(c => c.id === cp.clientId);
      const otherList = (cp.otherPersons || []).filter((o: any) => o.personName || o.lawyerName);
      parties.push({
        partyType: PartyType.Client,
        clientId: cp.clientId || null,
        name: selectedClient ? selectedClient.fullName : (cp.name || ''),
        capacity: cp.capacity ?? PartyCapacity.Plaintiff,
        disputeNature: cp.disputeNature ?? DisputeNature.Original,
        hasSameCapacityOthers: !!cp.hasSameCapacityOthers,
        otherPersonName: cp.hasSameCapacityOthers && otherList.length > 0 ? JSON.stringify(otherList) : null,
        otherLawyerName: cp.hasSameCapacityOthers && otherList.length > 0 ? otherList.map((o: any) => o.lawyerName).filter(Boolean).join('، ') : null
      });
    }

    for (const op of (raw.opponentParties as any[]) || []) {
      if (!op.name && !op.opponentLawyerName) continue;
      parties.push({
        partyType: PartyType.Opponent,
        name: op.name || '',
        capacity: op.capacity ?? PartyCapacity.Defendant,
        disputeNature: op.disputeNature ?? DisputeNature.Original,
        hasSameCapacityOthers: false,
        opponentLawyerName: op.opponentLawyerName || null
      });
    }

    const payload = {
      id: raw.id,
      companyCode: raw.companyCode,
      title: raw.title,
      status: raw.status,
      agreementDate: raw.agreementDate,
      startDate: raw.startDate,
      filingDate: raw.filingDate,
      closedDate: raw.closedDate,
      companyType: raw.companyType,
      otherCompanyType: raw.companyType === CompanyType.Other ? raw.otherCompanyType : null,
      companyNumber: raw.companyNumber,
      companyDuration: raw.companyDuration,
      authorityDetails: raw.authorityDetails,
      fileNumber: raw.fileNumber,
      fileYear: raw.fileYear instanceof Date ? raw.fileYear.getFullYear() : (raw.fileYear ? Number(raw.fileYear) : null),
      fileColor: raw.fileColor,
      contractProcedure: raw.contractProcedure,
      registryProcedure: raw.registryProcedure,
      registrationPlace: raw.registrationPlace,
      subsequentProcedures: raw.subsequentProcedures,
      taxNumber: raw.taxNumber,
      valueAddedTax: raw.valueAddedTax,
      result: raw.result,
      notes: raw.notes,
      clientId: raw.clientId,
      assignedLawyerId: raw.assignedLawyerId || null,
      parties
    };

    this.onSave.emit(payload);
  }
}

