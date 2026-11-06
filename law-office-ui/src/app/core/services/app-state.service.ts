import { Injectable, signal, inject } from '@angular/core';
import { SettingsService, SystemSettingDto } from './settings.service';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private settingsService = inject(SettingsService);
  private translate = inject(TranslateService);
  private primeng = inject(PrimeNG);
  
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
    const savedLang = (localStorage.getItem('lang') as 'ar' | 'en') || 'ar';
    this.setLanguage(savedLang);
  }

  setLanguage(lang: 'ar' | 'en') {
    this.currentLang.set(lang);
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    this.updatePrimeNGLocale(lang);
  }

  private updatePrimeNGLocale(lang: 'ar' | 'en') {
    if (lang === 'ar') {
      this.primeng.setTranslation({
        dayNames: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
        dayNamesShort: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
        dayNamesMin: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
        monthNames: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
        monthNamesShort: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
        today: 'اليوم',
        clear: 'مسح',
        dateFormat: 'dd/mm/yy',
        firstDayOfWeek: 6 // Saturday starts the week in Arabic calendar
      });
    } else {
      this.primeng.setTranslation({
        dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        today: 'Today',
        clear: 'Clear',
        dateFormat: 'dd/mm/yy',
        firstDayOfWeek: 0
      });
    }
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
