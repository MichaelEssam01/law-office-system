import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { Client } from '../../../core/services/client';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-client-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, CheckboxModule, TranslateModule],
  templateUrl: './client-dialog.html',
  styleUrl: './client-dialog.css'
})
export class ClientDialog implements OnInit {
  @Input() client: Client | null = null;
  @Output() onSave = new EventEmitter<Client>();
  @Output() onCancel = new EventEmitter<void>();

  formData: Client = {
    fullName: '',
    phone: '',
    email: '',
    address: '',
    nationalId: ''
  };
  hasNoNationalId: boolean = false;

  ngOnInit(): void {
    if (this.client) {
      this.formData = { ...this.client };
      // If editing and ID is empty, assume it's not present
      if (!this.formData.nationalId) {
        this.hasNoNationalId = true;
      }
    }
  }

  isNationalIdValid(): boolean {
    if (this.hasNoNationalId) return true;
    return /^\d{14}$/.test(this.formData.nationalId);
  }

  save() {
    if (!this.formData.fullName || !this.isNationalIdValid()) return;
    
    // Clear nationalId if not available
    const dataToSave = { ...this.formData };
    if (this.hasNoNationalId) {
      dataToSave.nationalId = '';
    }
    
    this.onSave.emit(dataToSave);
  }

  cancel() {
    this.onCancel.emit();
  }
}
