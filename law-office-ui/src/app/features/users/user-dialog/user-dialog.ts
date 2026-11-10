import { Component, EventEmitter, Input, OnInit, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PasswordModule } from 'primeng/password';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserManagementService, RolePermissionsDto, DEFAULT_ROLE_PERMISSIONS } from '../../../core/services/user-management.service';

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
  private translate = inject(TranslateService);

  userForm: FormGroup;
  loading = signal(false);
  selectedRoles = signal<string[]>(['Lawyer']);
  roleConfigs = signal<RolePermissionsDto[]>([]);
  availablePermissions = signal<string[]>([]);

  private static readonly SYSTEM_ROLE_INFO: Record<string, { labelKey: string; icon: string; descKey: string }> = {
    Admin: { labelKey: 'USERS.ROLES.ADMIN', icon: 'pi pi-shield', descKey: 'USERS.ROLE_DESC.ADMIN' },
    Lawyer: { labelKey: 'USERS.ROLES.LAWYER', icon: 'pi pi-briefcase', descKey: 'USERS.ROLE_DESC.LAWYER' },
    Receptionist: { labelKey: 'USERS.ROLES.RECEPTIONIST', icon: 'pi pi-desktop', descKey: 'USERS.ROLE_DESC.RECEPTIONIST' },
    Accountant: { labelKey: 'USERS.ROLES.ACCOUNTANT', icon: 'pi pi-wallet', descKey: 'USERS.ROLE_DESC.ACCOUNTANT' }
  };

  roles = computed(() => {
    const loaded = this.roleConfigs();
    const roleNames = loaded.length > 0
      ? loaded.map(r => r.role)
      : ['Admin', 'Lawyer', 'Receptionist', 'Accountant'];

    return roleNames.map(roleName => {
      const sys = UserManagementDialog.SYSTEM_ROLE_INFO[roleName];
      if (sys) {
        return {
          label: this.translate.instant(sys.labelKey),
          value: roleName,
          icon: sys.icon,
          descKey: sys.descKey
        };
      }
      return {
        label: roleName,
        value: roleName,
        icon: 'pi pi-id-card',
        descKey: 'USERS.ROLE_DESC.CUSTOM'
      };
    });
  });

  selectedRolePermissions = computed(() => {
    const chosenRoles = this.selectedRoles();
    const merged = new Set<string>();
    chosenRoles.forEach(role => {
      const found = this.roleConfigs().find(r => r.role === role);
      const perms = (found && found.permissions.length > 0)
        ? found.permissions
        : (role === 'Admin' ? this.availablePermissions() : (DEFAULT_ROLE_PERMISSIONS[role] || []));
      perms.forEach(p => merged.add(p));
    });
    return Array.from(merged);
  });

  groupedRolePermissions = computed(() => {
    const groups: { [key: string]: string[] } = {};
    this.selectedRolePermissions().forEach(p => {
      const parts = p.split('.');
      const category = parts[0];
      const action = parts[1];
      if (!groups[category]) groups[category] = [];
      groups[category].push(action);
    });
    return Object.entries(groups).map(([category, actions]) => ({ category, actions }));
  });

  constructor() {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      isActive: [true]
    });
  }

  isRoleSelected(roleValue: string): boolean {
    return this.selectedRoles().some(r => r === roleValue);
  }

  toggleRole(roleValue: string) {
    const current = this.selectedRoles();
    if (current.some(r => r === roleValue)) {
      if (current.length > 1) {
        this.selectedRoles.set(current.filter(r => r !== roleValue));
      }
    } else {
      this.selectedRoles.set([...current, roleValue]);
    }
  }

  async ngOnInit() {
    this.loading.set(true);
    try {
      const [perms, roles] = await Promise.all([
        this.userService.getAvailablePermissions(),
        this.userService.getRoles()
      ]);
      this.availablePermissions.set(perms);
      this.roleConfigs.set(roles);

      if (this.userId) {
        const user = await this.userService.getUser(this.userId);
        this.userForm.patchValue({
          fullName: user.fullName,
          email: user.email,
          isActive: user.isActive
        });
        const assignedRoles = user.roles && user.roles.length > 0 ? user.roles : (user.role ? [user.role] : ['Lawyer']);
        this.selectedRoles.set(assignedRoles);
        this.userForm.get('password')?.setValidators(null);
      } else {
        this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      }
      this.userForm.get('password')?.updateValueAndValidity();
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    if (this.userForm.invalid || this.selectedRoles().length === 0) return;

    this.loading.set(true);
    try {
      const formValue = this.userForm.value;
      const roles = this.selectedRoles();
      const payload = {
        ...formValue,
        role: roles[0],
        roles,
        permissions: []
      };
      if (this.userId) {
        await this.userService.updateUser(this.userId, { ...payload, id: this.userId });
      } else {
        await this.userService.createUser(payload);
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
}
