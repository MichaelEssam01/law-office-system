import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormArray, Validators, FormGroup } from '@angular/forms';
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
  ContractDetailDto,
  ContractStatus,
  ContractType,
  ContractPartyDto
} from '../../../core/services/contract.service';
import { PartyCapacity, PartyType } from '../../../core/services/case.service';
import { ClientService, Client } from '../../../core/services/client';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { UserManagementService } from '../../../core/services/user-management.service';
import { AutoSelectFilterDirective } from '../../../core/directives/auto-select-filter.directive';

@Component({
  selector: 'app-contract-dialog',
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
  templateUrl: './contract-dialog.html'
})
export class ContractDialog implements OnInit, OnChanges {
  @Input() contract: ContractDetailDto | null = null;
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

  contractForm = this.fb.group({
    id: [null as string | null],
    contractNumber: [''],
    title: ['', Validators.required],
    status: [ContractStatus.InDrafting, Validators.required],
    agreementDate: [null as Date | null],
    startDate: [null as Date | null, Validators.required],
    closedDate: [null as Date | null],
    contractType: [null as ContractType | null, Validators.required],
    otherContractType: [''],
    fileNumber: [''],
    fileYear: [new Date().getFullYear() as number | null],
    fileColor: [''],
    notes: [''],
    clientId: [null as string | null, Validators.required],
    assignedLawyerId: [null as string | null],
    clientParties: this.fb.array([]),
    otherParties: this.fb.array([])
  });

  clients = signal<Client[]>([]);
  lawyers = signal<any[]>([]);
  statuses = signal<any[]>([]);
  contractTypes = signal<any[]>([]);
  partyCapacities = signal<any[]>([]);

  ContractStatus = ContractStatus;
  ContractType = ContractType;

  constructor() {
    effect(() => {
      const lang = this.appState.currentLang();
      this.translate.get('CONTRACTS.TITLE').subscribe(() => {
        this.initOptions();
      });
    });
  }

  async ngOnInit() {
    await Promise.all([this.loadClients(), this.loadLawyers()]);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['contract'] || changes['visible']) {
      if (this.visible) {
        this.submitted.set(false);
        this.activeTab.set(0);
        this.clientParties.clear();
        this.otherParties.clear();

        if (this.contract) {
          this.contractForm.patchValue({
            id: this.contract.id,
            contractNumber: this.contract.contractNumber,
            title: this.contract.title,
            status: this.contract.status,
            agreementDate: this.contract.agreementDate ? new Date(this.contract.agreementDate) : null,
            startDate: this.contract.startDate ? new Date(this.contract.startDate) : null,
            closedDate: this.contract.closedDate ? new Date(this.contract.closedDate) : null,
            contractType: this.contract.contractType,
            otherContractType: this.contract.otherContractType || '',
            fileNumber: this.contract.fileNumber || '',
            fileYear: this.contract.fileYear ?? new Date().getFullYear(),
            fileColor: this.contract.fileColor || '',
            notes: this.contract.notes || '',
            clientId: this.contract.clientId,
            assignedLawyerId: this.contract.assignedLawyerId || null
          });

          if (this.contract.parties && this.contract.parties.length > 0) {
            for (const p of this.contract.parties) {
              if (p.partyType === PartyType.Client) {
                this.addClientParty(p);
              } else {
                this.addOtherParty(p);
              }
            }
          }
        } else {
          this.contractForm.reset({
            status: ContractStatus.InDrafting,
            startDate: null,
            fileYear: new Date().getFullYear()
          });
        }
      }
    }
  }

  initOptions() {
    this.statuses.set([
      { label: this.translate.instant('CONTRACTS.IN_DRAFTING'), value: ContractStatus.InDrafting },
      { label: this.translate.instant('CONTRACTS.FINISHED'), value: ContractStatus.Finished }
    ]);

    this.contractTypes.set([
      { label: this.translate.instant('CONTRACTS.TYPES.LEASE'), value: ContractType.Lease },
      { label: this.translate.instant('CONTRACTS.TYPES.SALE'), value: ContractType.Sale },
      { label: this.translate.instant('CONTRACTS.TYPES.GIFT'), value: ContractType.Gift },
      { label: this.translate.instant('CONTRACTS.TYPES.PARTNERSHIP'), value: ContractType.Partnership },
      { label: this.translate.instant('CONTRACTS.TYPES.MORTGAGE'), value: ContractType.Mortgage },
      { label: this.translate.instant('CONTRACTS.TYPES.CONTRACTING'), value: ContractType.Contracting },
      { label: this.translate.instant('CONTRACTS.TYPES.CONSULTING'), value: ContractType.Consulting },
      { label: this.translate.instant('CONTRACTS.TYPES.EMPLOYMENT'), value: ContractType.Employment },
      { label: this.translate.instant('CONTRACTS.TYPES.MARRIAGE'), value: ContractType.Marriage },
      { label: this.translate.instant('CONTRACTS.TYPES.EXPLOITATION'), value: ContractType.Exploitation },
      { label: this.translate.instant('CONTRACTS.TYPES.USUFRUCT'), value: ContractType.Usufruct },
      { label: this.translate.instant('CONTRACTS.TYPES.OTHER'), value: ContractType.Other }
    ]);

    this.partyCapacities.set([
      { label: this.translate.instant('CASES.CAPACITIES.PLAINTIFF'), value: PartyCapacity.Plaintiff },
      { label: this.translate.instant('CASES.CAPACITIES.DEFENDANT'), value: PartyCapacity.Defendant },
      { label: this.translate.instant('CASES.CAPACITIES.OTHER'), value: PartyCapacity.Other }
    ]);
  }

  get clientParties(): FormArray {
    return this.contractForm.get('clientParties') as FormArray;
  }

  get otherParties(): FormArray {
    return this.contractForm.get('otherParties') as FormArray;
  }

  addClientParty(data?: ContractPartyDto) {
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
      capacity: [data?.capacity ?? PartyCapacity.Other, Validators.required],
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

  addOtherParty(data?: ContractPartyDto) {
    const group = this.fb.group({
      name: [data?.name || '', Validators.required],
      capacity: [data?.capacity ?? PartyCapacity.Other, Validators.required],
      opponentLawyerName: [data?.opponentLawyerName || '']
    });
    this.otherParties.push(group);
  }

  removeOtherParty(index: number) {
    this.otherParties.removeAt(index);
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
    if (this.activeTab() < 2) {
      this.activeTab.set(this.activeTab() + 1);
    }
  }

  prevTab() {
    if (this.activeTab() > 0) {
      this.activeTab.set(this.activeTab() - 1);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.contractForm.get(fieldName);
    return !!(control && control.invalid && (this.submitted() || control.touched));
  }

  isPartyFieldInvalid(group: any, controlName: string): boolean {
    const ctrl = group?.get?.(controlName);
    return !!(ctrl && ctrl.invalid && (this.submitted() || ctrl.touched));
  }

  hasTabErrors(tabIndex: number): boolean {
    if (tabIndex === 0) {
      const fields = ['title', 'status', 'startDate', 'contractType', 'clientId'];
      return fields.some(f => this.isFieldInvalid(f));
    }
    if (tabIndex === 1) {
      const clientErr = this.clientParties.invalid && (this.submitted() || this.clientParties.touched);
      const otherErr = this.otherParties.invalid && (this.submitted() || this.otherParties.touched);
      return clientErr || otherErr;
    }
    return false;
  }

  save() {
    this.submitted.set(true);
    if (this.contractForm.invalid) {
      this.contractForm.markAllAsTouched();
      if (this.hasTabErrors(0)) {
        this.activeTab.set(0);
      } else if (this.hasTabErrors(1)) {
        this.activeTab.set(1);
      }
      return;
    }

    const raw = this.contractForm.value;
    const parties: ContractPartyDto[] = [];

    for (const cp of (raw.clientParties as any[]) || []) {
      const selectedClient = this.clients().find(c => c.id === cp.clientId);
      const otherList = (cp.otherPersons || []).filter((o: any) => o.personName || o.lawyerName);
      parties.push({
        partyType: PartyType.Client,
        clientId: cp.clientId || null,
        name: selectedClient ? selectedClient.fullName : (cp.name || ''),
        capacity: cp.capacity ?? PartyCapacity.Other,
        hasSameCapacityOthers: !!cp.hasSameCapacityOthers,
        otherPersonName: cp.hasSameCapacityOthers && otherList.length > 0 ? JSON.stringify(otherList) : null,
        otherLawyerName: cp.hasSameCapacityOthers && otherList.length > 0 ? otherList.map((o: any) => o.lawyerName).filter(Boolean).join('، ') : null
      });
    }

    for (const op of (raw.otherParties as any[]) || []) {
      if (!op.name && !op.opponentLawyerName) continue;
      parties.push({
        partyType: PartyType.Opponent,
        name: op.name || '',
        capacity: op.capacity ?? PartyCapacity.Other,
        hasSameCapacityOthers: false,
        opponentLawyerName: op.opponentLawyerName || null
      });
    }

    const payload = {
      id: raw.id,
      contractNumber: raw.contractNumber,
      title: raw.title,
      status: raw.status,
      agreementDate: raw.agreementDate,
      startDate: raw.startDate,
      closedDate: raw.closedDate,
      contractType: raw.contractType,
      otherContractType: raw.contractType === ContractType.Other ? raw.otherContractType : null,
      fileNumber: raw.fileNumber,
      fileYear: raw.fileYear,
      fileColor: raw.fileColor,
      notes: raw.notes,
      clientId: raw.clientId,
      assignedLawyerId: raw.assignedLawyerId || null,
      parties
    };

    this.onSave.emit(payload);
  }
}

