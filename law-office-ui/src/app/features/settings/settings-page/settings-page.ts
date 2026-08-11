import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SettingsService, SystemSettingDto } from '../../../core/services/settings.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, ToastModule, TranslateModule],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
  providers: [MessageService]
})
export class SettingsPage implements OnInit {
  settings = signal<SystemSettingDto>({
    firmName: '',
    lawyerName: '',
    address: '',
    phone: '',
    email: '',
    taxNumber: ''
  });
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);

  constructor(
    private settingsService: SettingsService,
    private appState: AppStateService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    await this.loadSettings();
  }

  async loadSettings() {
    this.loading.set(true);
    try {
      const data = await this.settingsService.getSettings();
      this.settings.set(data);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحميل الإعدادات' });
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    this.saving.set(true);
    try {
      await this.settingsService.updateSettings(this.settings());
      await this.appState.refreshSettings();
      this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حفظ الإعدادات بنجاح' });
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حفظ الإعدادات' });
    } finally {
      this.saving.set(false);
    }
  }
}
