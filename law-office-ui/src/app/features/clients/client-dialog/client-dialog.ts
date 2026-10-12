import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';
import { TabsModule } from 'primeng/tabs';
import { Client } from '../../../core/services/client';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AppStateService } from '../../../core/services/app-state.service';

export interface PhoneEntry {
  number: string;
  type: 'mobile' | 'home' | 'work' | 'whatsapp' | 'other';
}

@Component({
  selector: 'app-client-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule, 
    CheckboxModule, 
    SelectModule,
    RatingModule,
    TextareaModule,
    TabsModule,
    TranslateModule
  ],
  templateUrl: './client-dialog.html',
  styleUrl: './client-dialog.css'
})
export class ClientDialog implements OnInit {
  @Input() client: Client | null = null;
  @Output() onSave = new EventEmitter<Client>();
  @Output() onCancel = new EventEmitter<void>();

  appState = inject(AppStateService);

  formData: Client = {
    firstName: '',
    secondName: '',
    thirdName: '',
    fourthName: '',
    fullName: '',
    phone: '',
    homeLandline: '',
    workLandline: '',
    email: '',
    address: '',
    nationalId: '',
    job: '',
    solvencyRating: 0,
    commitmentRating: 0,
    cooperationRating: 0,
    networkRating: 0,
    otherRatings: '',
    relativesInfo: '',
    hasPowerOfAttorney: false,
    poaNumber: '',
    poaLetter: '',
    poaYear: new Date().getFullYear(),
    poaOffice: '',
    poaType: 'نفسه',
    poaCapacityDetails: '',
    instructions: ''
  };

  hasNoNationalId: boolean = false;
  activeTab: string = '0';
  submitted: boolean = false;

  // Star hover states
  hoverSolvency: number = 0;
  hoverCommitment: number = 0;
  hoverCooperation: number = 0;
  hoverNetwork: number = 0;

  // Dynamic Phone list for UX
  phoneEntries: PhoneEntry[] = [
    { number: '', type: 'mobile' }
  ];

  private translate = inject(TranslateService);

  get phoneTypes() {
    return [
      { label: this.translate.instant('CLIENTS.PHONE_TYPE.MOBILE'), value: 'mobile' },
      { label: this.translate.instant('CLIENTS.PHONE_TYPE.HOME'), value: 'home' },
      { label: this.translate.instant('CLIENTS.PHONE_TYPE.WORK'), value: 'work' },
      { label: this.translate.instant('CLIENTS.PHONE_TYPE.WHATSAPP'), value: 'whatsapp' },
      { label: this.translate.instant('CLIENTS.PHONE_TYPE.OTHER'), value: 'other' }
    ];
  }

  get poaTypes() {
    return [
      { label: this.translate.instant('CLIENTS.POA_TYPE_SELF'), value: 'نفسه' },
      { label: this.translate.instant('CLIENTS.POA_TYPE_CAPACITY'), value: 'صفة' },
      { label: this.translate.instant('CLIENTS.POA_TYPE_BOTH'), value: 'نفسه وصفة' }
    ];
  }

  ngOnInit(): void {
    if (this.client) {
      this.formData = { ...this.client };
      if (!this.formData.nationalId) {
        this.hasNoNationalId = true;
      }
      if (!this.formData.poaType) {
        this.formData.poaType = 'نفسه';
      }

      // Populate phone entries from existing data
      this.phoneEntries = [];
      if (this.formData.phone) {
        const numbers = this.formData.phone.split(',').map(n => n.trim()).filter(n => n);
        numbers.forEach(num => this.phoneEntries.push({ number: num, type: 'mobile' }));
      }
      if (this.formData.homeLandline) {
        this.phoneEntries.push({ number: this.formData.homeLandline, type: 'home' });
      }
      if (this.formData.workLandline) {
        this.phoneEntries.push({ number: this.formData.workLandline, type: 'work' });
      }

      if (this.phoneEntries.length === 0) {
        this.phoneEntries.push({ number: '', type: 'mobile' });
      }
    }
  }

  addPhoneField() {
    this.phoneEntries.push({ number: '', type: 'mobile' });
  }

  removePhoneField(index: number) {
    if (this.phoneEntries.length > 1) {
      this.phoneEntries.splice(index, 1);
    } else {
      this.phoneEntries[0] = { number: '', type: 'mobile' };
    }
  }

  isNationalIdValid(): boolean {
    if (this.hasNoNationalId) return true;
    if (!this.formData.nationalId) return false;
    return /^\d{14}$/.test(this.formData.nationalId);
  }

  isFormValid(): boolean {
    const hasFirstName = !!(this.formData.firstName && this.formData.firstName.trim());
    return hasFirstName && this.isNationalIdValid();
  }

  save() {
    this.submitted = true;

    if (!this.isFormValid()) {
      // Auto-switch to Tab 0 where the mandatory fields (First Name / National ID) reside
      this.activeTab = '0';
      return;
    }

    // Compute FullName
    const parts = [
      this.formData.firstName?.trim() || '',
      this.formData.secondName?.trim() || '',
      this.formData.thirdName?.trim() || '',
      this.formData.fourthName?.trim() || ''
    ].filter(p => p.length > 0);

    this.formData.fullName = parts.join(' ');

    // Aggregate phone entries
    const mobiles = this.phoneEntries.filter(p => p.type === 'mobile' || p.type === 'whatsapp' || p.type === 'other').map(p => p.number.trim()).filter(n => n);
    const home = this.phoneEntries.find(p => p.type === 'home')?.number.trim() || '';
    const work = this.phoneEntries.find(p => p.type === 'work')?.number.trim() || '';

    this.formData.phone = mobiles.join(', ');
    this.formData.homeLandline = home;
    this.formData.workLandline = work;

    const dataToSave = { ...this.formData };
    if (this.hasNoNationalId) {
      dataToSave.nationalId = '';
    }

    if (!dataToSave.hasPowerOfAttorney) {
      dataToSave.poaNumber = '';
      dataToSave.poaLetter = '';
      dataToSave.poaYear = undefined;
      dataToSave.poaOffice = '';
      dataToSave.poaType = '';
      dataToSave.poaCapacityDetails = '';
    }

    this.onSave.emit(dataToSave);
  }

  cancel() {
    this.onCancel.emit();
  }
}
