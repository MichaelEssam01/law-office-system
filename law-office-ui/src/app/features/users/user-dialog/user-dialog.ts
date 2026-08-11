import { Component, EventEmitter, Input, OnInit, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PasswordModule } from 'primeng/password';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserManagementService } from '../../../core/services/user-management.service';

@Component({
  selector: 'app-user-management-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    ButtonModule, 
    InputTextModule, 
    SelectModule, 
    CheckboxModule,
    ToggleSwitchModule,
    PasswordModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './user-dialog.html'
})
export class UserManagementDialog implements OnInit {
  @Input() userId: string | null = null;
  @Output() onSave = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private userService = inject(UserManagementService);

  userForm: FormGroup;
  loading = signal(false);
  availablePermissions = signal<string[]>([]);
  
  groupedPermissions = computed(() => {
    const groups: { [key: string]: { action: string, value: string }[] } = {};
    this.availablePermissions().forEach(p => {
      const parts = p.split('.');
      const category = parts[0];
      const action = parts[1];
      if (!groups[category]) groups[category] = [];
      groups[category].push({ action, value: p });
    });
    return Object.entries(groups).map(([category, perms]) => ({ category, perms }));
  });

  private translate = inject(TranslateService);

  roles = computed(() => [
    { label: this.translate.instant('USERS.ROLES.ADMIN'), value: 'Admin' },
    { label: this.translate.instant('USERS.ROLES.LAWYER'), value: 'Lawyer' },
    { label: this.translate.instant('USERS.ROLES.RECEPTIONIST'), value: 'Receptionist' },
    { label: this.translate.instant('USERS.ROLES.ACCOUNTANT'), value: 'Accountant' }
  ]);

  constructor() {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      role: ['Lawyer', Validators.required],
      isActive: [true],
      permissions: [[]]
    });
  }

  async ngOnInit() {
    this.loading.set(true);
    try {
      this.availablePermissions.set(await this.userService.getAvailablePermissions());
      
      if (this.userId) {
        const user = await this.userService.getUser(this.userId);
        this.userForm.patchValue({
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          permissions: user.permissions
        });
        // Password is not required when editing
        this.userForm.get('password')?.setValidators(null);
      } else {
        this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    if (this.userForm.invalid) return;

    this.loading.set(true);
    try {
      const formValue = this.userForm.value;
      if (this.userId) {
        await this.userService.updateUser(this.userId, { ...formValue, id: this.userId });
      } else {
        await this.userService.createUser(formValue);
      }
      this.onSave.emit();
    } catch (error) {
      console.error('Failed to save user', error);
    } finally {
      this.loading.set(false);
    }
  }

  cancel() {
    this.onCancel.emit();
  }

  getPermissionLabel(permission: string): string {
    return permission.replace('.', '_').toUpperCase();
  }
}
