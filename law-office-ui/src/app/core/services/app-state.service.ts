import { Injectable, signal, inject } from '@angular/core';
import { SettingsService, SystemSettingDto } from './settings.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private settingsService = inject(SettingsService);
  private translate = inject(TranslateService);
  
  currentLang = signal<'ar' | 'en'>('ar');
  isSidebarOpen = signal(false);

  settings = signal<SystemSettingDto>({
    firmName: 'مكتب المحاماة',
    lawyerName: '',
    address: '',
    phone: '',
    email: '',
    taxNumber: ''
  });

  constructor() {
    this.loadSettings();
    const savedLang = localStorage.getItem('lang') as 'ar' | 'en';
    if (savedLang) {
      this.setLanguage(savedLang);
    }
  }

  setLanguage(lang: 'ar' | 'en') {
    this.currentLang.set(lang);
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang() === 'ar' ? 'en' : 'ar');
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  async loadSettings() {
    try {
      // Attempt to load full settings (requires authentication)
      const data = await this.settingsService.getSettings();
      if (data && data.firmName) {
        this.settings.set(data);
      }
    } catch (error: any) {
      // If we get a 401 Unauthorized, it means the user isn't logged in.
      // We fall back to loading ONLY the public information (like Firm Name).
      if (error.status === 401) {
        try {
          const publicData = await this.settingsService.getPublicSettings();
          if (publicData && publicData.firmName) {
            this.settings.update(s => ({ ...s, firmName: publicData.firmName }));
          }
        } catch (pubError) {
          console.warn('Could not load public settings', pubError);
        }
      } else {
        console.error('Failed to load app settings', error);
      }
    }
  }

  refreshSettings() {
    return this.loadSettings();
  }
}
