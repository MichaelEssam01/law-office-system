import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Client } from '../../../core/services/client';

@Component({
  selector: 'app-client-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule],
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

  ngOnInit(): void {
    if (this.client) {
      this.formData = { ...this.client };
    }
  }

  save() {
    this.onSave.emit(this.formData);
  }

  cancel() {
    this.onCancel.emit();
  }
}
