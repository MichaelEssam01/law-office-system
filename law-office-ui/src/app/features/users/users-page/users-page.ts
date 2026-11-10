import { Component, Input, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { AppStateService } from '../../../core/services/app-state.service';
import { UserManagementService, UserListDto, RolePermissionsDto, DEFAULT_ROLE_PERMISSIONS } from '../../../core/services/user-management.service';
import { UserManagementDialog } from '../user-dialog/user-dialog';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    TableModule, 
    ButtonModule, 
    InputTextModule, 
    DialogModule, 
    SelectModule,
    ToastModule, 
    ConfirmDialogModule, 
    CheckboxModule,
    TranslateModule,
    TooltipModule,
    UserManagementDialog,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './users-page.html'
})
export class UsersPage implements OnInit {
  @Input() embedded = false;

  private userService = inject(UserManagementService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  public cdr = inject(ChangeDetectorRef);
  public appState = inject(AppStateService);

  activeSubTab = signal<'accounts' | 'roles'>('accounts');
  users = signal<UserListDto[]>([]);
  rolesData = signal<RolePermissionsDto[]>([]);
  availablePermissions = signal<string[]>([]);
  selectedRoleName = signal<string>('Lawyer');
  editingPermissions = signal<string[]>([]);

  loading = signal(false);
  savingRole = signal(false);
  displayDialog = signal(false);
  selectedUserId = signal<string | null>(null);

  // Create Role Dialog state
  displayRoleDialog = signal(false);
  newRoleName = signal('');
  copyFromRole = signal<string>('');
  creatingRole = signal(false);

  private static readonly SYSTEM_ROLE_META: Record<string, { icon: string; colorClass: string; badgeClass: string; descKey: string }> = {
    Admin: { icon: 'pi pi-shield', colorClass: 'text-purple-600 bg-purple-50 border-purple-200', badgeClass: 'bg-purple-100 text-purple-700', descKey: 'USERS.ROLE_DESC.ADMIN' },
    Lawyer: { icon: 'pi pi-briefcase', colorClass: 'text-blue-600 bg-blue-50 border-blue-200', badgeClass: 'bg-blue-100 text-blue-700', descKey: 'USERS.ROLE_DESC.LAWYER' },
    Receptionist: { icon: 'pi pi-desktop', colorClass: 'text-teal-600 bg-teal-50 border-teal-200', badgeClass: 'bg-teal-100 text-teal-700', descKey: 'USERS.ROLE_DESC.RECEPTIONIST' },
    Accountant: { icon: 'pi pi-wallet', colorClass: 'text-amber-600 bg-amber-50 border-amber-200', badgeClass: 'bg-amber-100 text-amber-700', descKey: 'USERS.ROLE_DESC.ACCOUNTANT' }
  };

  roleCards = computed(() => {
    const loaded = this.rolesData();
    const roleNames = loaded.length > 0
      ? loaded.map(r => r.role)
      : ['Admin', 'Lawyer', 'Receptionist', 'Accountant'];

    return roleNames.map(role => {
      const sysMeta = UsersPage.SYSTEM_ROLE_META[role];
      if (sysMeta) {
        return { role, ...sysMeta, isSystemRole: true };
      }
      return {
        role,
        icon: 'pi pi-id-card',
        colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        badgeClass: 'bg-indigo-100 text-indigo-700',
        descKey: 'USERS.ROLE_DESC.CUSTOM',
        isSystemRole: false
      };
    });
  });

  copyRoleOptions = computed(() => [
    { label: this.translate.instant('USERS.START_EMPTY_PERMS'), value: '' },
    ...this.roleCards().map(r => ({
      label: `${this.getRoleLabel(r.role)}`,
      value: r.role
    }))
  ]);

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

  ngOnInit() {
    this.loadAll();
  }

  async loadAll() {
    this.loading.set(true);
    try {
      const [users, roles, perms] = await Promise.all([
        this.userService.getUsers(),
        this.userService.getRoles(),
        this.userService.getAvailablePermissions()
      ]);
      this.users.set(users);
      this.rolesData.set(roles);
      this.availablePermissions.set(perms);
      this.selectRole(this.selectedRoleName());
    } catch {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: 'Failed to load user management data' });
    } finally {
      this.loading.set(false);
    }
  }

  selectRole(roleName: string) {
    this.selectedRoleName.set(roleName);
    if (roleName === 'Admin') {
      this.editingPermissions.set([...this.availablePermissions()]);
      return;
    }
    const found = this.rolesData().find(r => r.role === roleName);
    if (found) {
      this.editingPermissions.set([...found.permissions]);
    } else {
      this.editingPermissions.set([...(DEFAULT_ROLE_PERMISSIONS[roleName] || [])]);
    }
  }

  isSystemRole(roleName: string): boolean {
    return !!UsersPage.SYSTEM_ROLE_META[roleName];
  }

  hasDefaultPreset(roleName: string): boolean {
    return !!DEFAULT_ROLE_PERMISSIONS[roleName];
  }

  openNewRoleDialog() {
    this.newRoleName.set('');
    this.copyFromRole.set('');
    this.displayRoleDialog.set(true);
  }

  async createNewRole() {
    const name = this.newRoleName().trim();
    if (!name) return;

    this.creatingRole.set(true);
    try {
      let initialPermissions: string[] = [];
      const templateRole = this.copyFromRole();
      if (templateRole) {
        if (templateRole === 'Admin') {
          initialPermissions = [...this.availablePermissions()];
        } else {
          const found = this.rolesData().find(r => r.role === templateRole);
          initialPermissions = found ? [...found.permissions] : [...(DEFAULT_ROLE_PERMISSIONS[templateRole] || [])];
        }
      }

      const created = await this.userService.createRole(name, initialPermissions);
      const updatedRoles = await this.userService.getRoles();
      this.rolesData.set(updatedRoles);
      this.selectRole(created.role);
      this.displayRoleDialog.set(false);
      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('COMMON.SUCCESS'),
        detail: this.translate.instant('USERS.ROLE_CREATED')
      });
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('COMMON.ERROR'),
        detail: err.error?.message || this.translate.instant('USERS.ROLE_CREATE_ERROR')
      });
    } finally {
      this.creatingRole.set(false);
    }
  }

  deleteRole(roleName: string) {
    if (this.isSystemRole(roleName)) return;
    this.confirmationService.confirm({
      message: `${this.translate.instant('USERS.DELETE_ROLE_CONFIRM')} (${this.getRoleLabel(roleName)})`,
      header: this.translate.instant('COMMON.CONFIRM'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: async () => {
        try {
          await this.userService.deleteRole(roleName);
          const updatedRoles = await this.userService.getRoles();
          this.rolesData.set(updatedRoles);
          this.selectRole('Lawyer');
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('COMMON.SUCCESS'),
            detail: this.translate.instant('USERS.ROLE_DELETED')
          });
        } catch (err: any) {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('COMMON.ERROR'),
            detail: err.error?.message || this.translate.instant('COMMON.ERROR')
          });
        }
      }
    });
  }

  getUserRoles(user: UserListDto): string[] {
    if (user.roles && user.roles.length > 0) return user.roles;
    return user.role ? [user.role] : [];
  }

  getRoleUsersCount(roleName: string): number {
    return this.users().filter(u => this.getUserRoles(u).some(r => r === roleName)).length;
  }

  isPermissionChecked(perm: string): boolean {
    if (this.selectedRoleName() === 'Admin') return true;
    return this.editingPermissions().includes(perm);
  }

  togglePermission(perm: string) {
    if (this.selectedRoleName() === 'Admin') return;
    const current = this.editingPermissions();
    if (current.includes(perm)) {
      this.editingPermissions.set(current.filter(p => p !== perm));
    } else {
      this.editingPermissions.set([...current, perm]);
    }
  }

  isCategoryAllSelected(perms: { action: string, value: string }[]): boolean {
    if (this.selectedRoleName() === 'Admin') return true;
    const current = this.editingPermissions();
    return perms.every(p => current.includes(p.value));
  }

  toggleCategoryAll(perms: { action: string, value: string }[]) {
    if (this.selectedRoleName() === 'Admin') return;
    const current = this.editingPermissions();
    const allSelected = this.isCategoryAllSelected(perms);
    const values = perms.map(p => p.value);
    if (allSelected) {
      this.editingPermissions.set(current.filter(p => !values.includes(p)));
    } else {
      const merged = Array.from(new Set([...current, ...values]));
      this.editingPermissions.set(merged);
    }
  }

  resetRoleToDefaultPreset() {
    const role = this.selectedRoleName();
    if (role === 'Admin') return;
    this.editingPermissions.set([...(DEFAULT_ROLE_PERMISSIONS[role] || [])]);
  }

  async saveRolePermissions() {
    const role = this.selectedRoleName();
    if (role === 'Admin') return;
    this.savingRole.set(true);
    try {
      await this.userService.updateRolePermissions(role, this.editingPermissions());
      const updatedRoles = await this.userService.getRoles();
      this.rolesData.set(updatedRoles);
      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('COMMON.SUCCESS'),
        detail: this.translate.instant('USERS.ROLE_PERMS_SAVED')
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('COMMON.ERROR'),
        detail: this.translate.instant('COMMON.ERROR')
      });
    } finally {
      this.savingRole.set(false);
    }
  }

  openNew() {
    this.selectedUserId.set(null);
    this.displayDialog.set(true);
  }

  getRoleLabel(role: string): string {
    const keyMap: { [key: string]: string } = {
      'Admin': 'USERS.ROLES.ADMIN',
      'Lawyer': 'USERS.ROLES.LAWYER',
      'Receptionist': 'USERS.ROLES.RECEPTIONIST',
      'Accountant': 'USERS.ROLES.ACCOUNTANT'
    };
    return keyMap[role] ? this.translate.instant(keyMap[role]) : role;
  }

  editUser(user: UserListDto) {
    this.selectedUserId.set(user.id);
    this.displayDialog.set(true);
  }

  onSave() {
    this.displayDialog.set(false);
    this.loadAll();
    this.messageService.add({ severity: 'success', summary: this.translate.instant('COMMON.SUCCESS'), detail: this.translate.instant('USERS.SAVE_SUCCESS') });
  }

  onCancel() {
    this.displayDialog.set(false);
  }

  deleteUser(user: UserListDto) {
    this.confirmationService.confirm({
      message: `${this.translate.instant('COMMON.CONFIRM_DELETE')} (${user.fullName})`,
      header: this.translate.instant('COMMON.CONFIRM'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.userService.deleteUser(user.id);
          this.loadAll();
          this.messageService.add({ severity: 'success', summary: this.translate.instant('COMMON.SUCCESS'), detail: this.translate.instant('USERS.DELETE_SUCCESS') });
        } catch {
          this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('COMMON.ERROR') });
        }
      }
    });
  }
}
