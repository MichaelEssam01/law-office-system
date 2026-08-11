import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { AppStateService } from '../../../core/services/app-state.service';
import { UserManagementService, UserListDto } from '../../../core/services/user-management.service';
import { UserManagementDialog } from '../user-dialog/user-dialog';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    InputTextModule, 
    DialogModule, 
    ToastModule, 
    ConfirmDialogModule, 
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
  private userService = inject(UserManagementService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  public cdr = inject(ChangeDetectorRef);
  public appState = inject(AppStateService);

  users = signal<UserListDto[]>([]);
  loading = signal(false);
  displayDialog = signal(false);
  selectedUserId = signal<string | null>(null);

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading.set(true);
    try {
      const data = await this.userService.getUsers();
      this.users.set(data);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users' });
    } finally {
      this.loading.set(false);
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
    this.loadUsers();
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User saved successfully' });
  }

  onCancel() {
    this.displayDialog.set(false);
  }

  deleteUser(user: UserListDto) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete user ${user.fullName}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.userService.deleteUser(user.id);
          this.loadUsers();
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User deleted' });
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete user' });
        }
      }
    });
  }
}
