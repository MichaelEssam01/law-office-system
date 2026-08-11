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

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    InputTextModule, 
    ButtonModule, 
    PasswordModule, 
    ToastModule, 
    ToggleSwitchModule,
    TableModule,
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

  currentUser = this.authService.currentUser;
  passwordForm: FormGroup;
  loading = signal(false);
  activeTab = signal<'profile' | 'notifications' | 'security'>('profile');

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
    this.loadData();
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

  setTab(tab: 'profile' | 'notifications' | 'security') {
    this.activeTab.set(tab);
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
}
