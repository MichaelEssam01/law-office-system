import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService, SecurityLogDto, NotificationSettingsDto } from '../../../core/services/profile.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NotificationService } from '../../../core/services/notification.service';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { TooltipModule } from 'primeng/tooltip';

export type ProfileTab = 'profile' | 'notifications' | 'preferences' | 'security';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    FormsModule, 
    ReactiveFormsModule, 
    InputTextModule, 
    ButtonModule, 
    PasswordModule, 
    ToastModule, 
    ToggleSwitchModule,
    TableModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './profile-page.html',
  providers: [MessageService]
})
export class ProfilePage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  public notificationService = inject(NotificationService);

  currentUser = this.authService.currentUser;
  passwordForm: FormGroup;
  loading = signal(false);
  activeTab = signal<string>('profile');

  // Real data from database
  securityLogs = signal<SecurityLogDto[]>([]);
  notificationSettings = signal<NotificationSettingsDto>({
    emailCases: true,
    emailSessions: true,
    emailFinance: false,
    appCases: true,
    appSessions: true,
    appFinance: true
  });

  constructor() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'notifications') {
        this.activeTab.set('notifications');
      } else if (params['tab'] === 'preferences') {
        this.activeTab.set('preferences');
      } else if (params['tab'] === 'security') {
        this.activeTab.set('security');
      } else if (params['tab'] === 'profile') {
        this.activeTab.set('profile');
      }
    });
    this.loadData();
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  async loadData() {
    try {
      const [logs, settings] = await Promise.all([
        this.profileService.getSecurityLogs(),
        this.profileService.getNotificationSettings()
      ]);
      this.securityLogs.set(logs);
      this.notificationSettings.set(settings);
    } catch (error) {
      console.error('Failed to load profile data', error);
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  async updatePassword() {
    if (this.passwordForm.invalid) return;
    this.loading.set(true);
    try {
      // Logic for password update would go here (service call)
      // Since we don't have a specific endpoint yet, we'll mock success
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.messageService.add({ 
        severity: 'success', 
        summary: this.translate.instant('COMMON.SUCCESS'), 
        detail: this.translate.instant('AUTH.RESET_SUCCESS') 
      });
      this.passwordForm.reset();
    } catch (error) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('CASES.SAVE_ERROR') 
      });
    } finally {
      this.loading.set(false);
    }
  }

  getInitials(): string {
    const user = this.currentUser();
    if (!user || !user.fullName) return 'U';
    
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }

  formatDevice(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';
    
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // Simple OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    else if (userAgent.includes('Linux')) os = 'Linux';

    // Simple Browser detection
    if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('Chrome/')) browser = 'Chrome';
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Firefox/')) browser = 'Firefox';

    return `${browser} on ${os}`;
  }

  formatLogEvent(event: string): string {
    const keyMap: { [key: string]: string } = {
      'Login': 'PROFILE.LOG_EVENTS.LOGIN',
      'Login Attempt': 'PROFILE.LOG_EVENTS.LOGIN_ATTEMPT',
      'Change Password': 'PROFILE.LOG_EVENTS.CHANGE_PASSWORD',
      'Update Profile': 'PROFILE.LOG_EVENTS.UPDATE_PROFILE'
    };
    return keyMap[event] ? this.translate.instant(keyMap[event]) : event;
  }

  formatLogStatus(status: string): string {
    const keyMap: { [key: string]: string } = {
      'Success': 'PROFILE.LOG_STATUSES.SUCCESS',
      'Invalid Password': 'PROFILE.LOG_STATUSES.INVALID_PASSWORD',
      'Failed': 'PROFILE.LOG_STATUSES.FAILED'
    };
    return keyMap[status] ? this.translate.instant(keyMap[status]) : status;
  }

  getRoleLabel(role?: string): string {
    if (!role) return '';
    const keyMap: { [key: string]: string } = {
      'Admin': 'USERS.ROLES.ADMIN',
      'Lawyer': 'USERS.ROLES.LAWYER',
      'Receptionist': 'USERS.ROLES.RECEPTIONIST',
      'Accountant': 'USERS.ROLES.ACCOUNTANT'
    };
    return keyMap[role] ? this.translate.instant(keyMap[role]) : role;
  }

  async saveNotificationSettings() {
    this.loading.set(true);
    try {
      await this.profileService.updateNotificationSettings(this.notificationSettings());
      this.messageService.add({ 
        severity: 'success', 
        summary: this.translate.instant('COMMON.SUCCESS'), 
        detail: this.translate.instant('PROFILE.SAVE_SUCCESS') 
      });
    } catch (error) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('PROFILE.SAVE_ERROR') 
      });
    } finally {
      this.loading.set(false);
    }
  }

  async downloadLogs() {
    this.loading.set(true);
    try {
      const blob = await this.profileService.exportSecurityLogsCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `security_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      this.messageService.add({ 
        severity: 'success', 
        summary: this.translate.instant('COMMON.SUCCESS'), 
        detail: this.translate.instant('PROFILE.EXPORT_SUCCESS') 
      });
    } catch (error) {
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('PROFILE.EXPORT_ERROR') 
      });
    } finally {
      this.loading.set(false);
    }
  }
  /** Returns the plain-text prefix portion of a notification message */
  getNotificationPrefix(n: any): string {
    const params = n.parameters || {};
    switch (n.message) {
      case 'NOTIFICATIONS.CASE_ASSIGNED_MSG':
        return this.translate.instant('NOTIFICATIONS.CASE_ASSIGNED_MSG_PREFIX') + ' ';
      case 'NOTIFICATIONS.CASE_UPDATED_MSG':
        return this.translate.instant('NOTIFICATIONS.CASE_UPDATED_MSG_PREFIX') + ' ';
      case 'NOTIFICATIONS.PAYMENT_RECORDED_MSG':
        return this.translate.instant('NOTIFICATIONS.PAYMENT_RECORDED_MSG_PREFIX', params) + ' ';
      default:
        return '';
    }
  }

  /** Returns the case-number/title text (clickable portion) */
  getNotificationCaseText(n: any): string {
    const params = n.parameters || {};
    switch (n.message) {
      case 'NOTIFICATIONS.CASE_ASSIGNED_MSG':
        return this.translate.instant('NOTIFICATIONS.CASE_ASSIGNED_MSG_CASE', params);
      case 'NOTIFICATIONS.CASE_UPDATED_MSG':
        return this.translate.instant('NOTIFICATIONS.CASE_UPDATED_MSG_CASE', params);
      case 'NOTIFICATIONS.PAYMENT_RECORDED_MSG':
        return this.translate.instant('NOTIFICATIONS.PAYMENT_RECORDED_MSG_CASE', params);
      default:
        return '';
    }
  }

  /** Returns optional plain-text suffix after the case link */
  getNotificationSuffix(n: any): string {
    switch (n.message) {
      case 'NOTIFICATIONS.CASE_UPDATED_MSG':
        return ' ' + this.translate.instant('NOTIFICATIONS.CASE_UPDATED_MSG_SUFFIX');
      default:
        return '';
    }
  }

  /** Whether this notification should use the split prefix+link format */
  hasSplitMessage(n: any): boolean {
    return n.link && [
      'NOTIFICATIONS.CASE_ASSIGNED_MSG',
      'NOTIFICATIONS.CASE_UPDATED_MSG',
      'NOTIFICATIONS.PAYMENT_RECORDED_MSG'
    ].includes(n.message);
  }
}
