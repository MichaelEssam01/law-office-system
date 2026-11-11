import { Component, computed, effect, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { AuthService } from '../../core/services/auth.service';
import { AppStateService } from '../../core/services/app-state.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { NotificationService, NotificationDto } from '../../core/services/notification.service';
import { CaseService, CaseListDto } from '../../core/services/case.service';
import { ClientService, Client } from '../../core/services/client';
import { ContractService, ContractListDto } from '../../core/services/contract.service';
import { RegistrationService, RegistrationListDto } from '../../core/services/registration.service';
import { CompanyService, CompanyListDto } from '../../core/services/company.service';
import { SessionService, SessionListDto } from '../../core/services/session.service';
import { PopoverModule } from 'primeng/popover';
import { Router, RouterModule } from '@angular/router';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

export interface GlobalSearchResult {
  id: string;
  category: 'Cases' | 'Clients' | 'Contracts' | 'Registrations' | 'Companies' | 'Sessions';
  categoryLabelKey: string;
  icon: string;
  badgeClass: string;
  code: string;
  title: string;
  subtitle?: string;
  route: string[];
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    RouterModule,
    AvatarModule, 
    InputTextModule, 
    BadgeModule, 
    TranslateModule, 
    MenuModule, 
    IconFieldModule, 
    InputIconModule, 
    PopoverModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  public authService = inject(AuthService);
  public appState = inject(AppStateService);
  public notificationService = inject(NotificationService);
  private caseService = inject(CaseService);
  private clientService = inject(ClientService);
  private contractService = inject(ContractService);
  private registrationService = inject(RegistrationService);
  private companyService = inject(CompanyService);
  private sessionService = inject(SessionService);
  private translate = inject(TranslateService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private elRef = inject(ElementRef);

  profileMenuItems: MenuItem[] = [];
  notifScopeTab = signal<'personal' | 'system'>('personal');

  // Global Search State
  searchQuery = signal('');
  searchOpen = signal(false);
  searchLoading = signal(false);
  private searchIndexLoaded = false;
  private cachedCases = signal<CaseListDto[]>([]);
  private cachedClients = signal<Client[]>([]);
  private cachedContracts = signal<ContractListDto[]>([]);
  private cachedRegistrations = signal<RegistrationListDto[]>([]);
  private cachedCompanies = signal<CompanyListDto[]>([]);
  private cachedSessions = signal<SessionListDto[]>([]);

  private normalizeSearchText(val?: string | number | null): string {
    if (val === null || val === undefined) return '';
    return String(val)
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
      .trim();
  }

  private matchesSearch(query: string, ...fields: (string | number | null | undefined)[]): boolean {
    return fields.some(f => {
      const norm = this.normalizeSearchText(f);
      return norm.includes(query);
    });
  }

  private getCaseTypeSearchKeywords(caseType?: number | null): string {
    const map: Record<number, string> = {
      0: 'إداري اداري administrative',
      1: 'أسرة اسره family',
      2: 'اقتصادية اقتصاديه economic',
      3: 'إيجارات ايجارات rents',
      4: 'دستورية دستوريه constitutional',
      5: 'تجاري commercial',
      6: 'تعويضات compensation',
      7: 'تنفيذ enforcement',
      8: 'صحة توقيع صحه توقيع signature validity',
      9: 'عمال labor',
      10: 'مدني civil',
      11: 'مدني مستأنف مستانف civil appealed',
      12: 'مستعجل urgent',
      13: 'جنائي criminal',
      14: 'أخرى اخرى other'
    };
    return caseType !== null && caseType !== undefined ? (map[caseType] || '') : '';
  }

  private getCaseStatusSearchKeywords(status?: number | null): string {
    const map: Record<number, string> = {
      1: 'متداولة متداوله قيد التداول in progress',
      2: 'معلقة معلقه pending',
      4: 'منتهية منتهيه finished',
      5: 'موقوفة موقوفه suspended'
    };
    return status !== null && status !== undefined ? (map[status] || '') : '';
  }

  searchResults = computed<GlobalSearchResult[]>(() => {
    const q = this.normalizeSearchText(this.searchQuery());
    if (!q) return [];

    const results: GlobalSearchResult[] = [];

    for (const c of this.cachedCases()) {
      if (
        this.matchesSearch(
          q,
          c.caseNumber,
          c.courtCaseNumber,
          c.fileNumber,
          c.title,
          c.clientName,
          c.opponentName,
          c.lawyerName,
          this.getCaseTypeSearchKeywords(c.caseType),
          this.getCaseStatusSearchKeywords(c.status),
          'قضية قضايا القضايا case cases'
        )
      ) {
        results.push({
          id: `case-${c.id}`,
          category: 'Cases',
          categoryLabelKey: 'SIDEBAR.CASES',
          icon: 'pi pi-briefcase',
          badgeClass: 'bg-blue-100 text-blue-700',
          code: c.caseNumber,
          title: c.title,
          subtitle: c.clientName,
          route: ['/cases', c.id]
        });
      }
      if (results.length >= 12) break;
    }

    for (const cl of this.cachedClients()) {
      if (
        this.matchesSearch(
          q,
          cl.fullName,
          cl.phone,
          cl.nationalId,
          cl.email,
          cl.address,
          cl.job,
          cl.poaNumber,
          cl.poaOffice,
          cl.clientNumber,
          'موكل موكلين الموكلين عميل client clients'
        )
      ) {
        results.push({
          id: `client-${cl.id}`,
          category: 'Clients',
          categoryLabelKey: 'SIDEBAR.CLIENTS',
          icon: 'pi pi-users',
          badgeClass: 'bg-emerald-100 text-emerald-700',
          code: cl.clientNumber ? `#${cl.clientNumber}` : '',
          title: cl.fullName,
          subtitle: cl.phone || cl.nationalId,
          route: ['/clients'],
          queryParams: { search: cl.fullName }
        });
      }
      if (results.length >= 15) break;
    }

    for (const ct of this.cachedContracts()) {
      if (
        this.matchesSearch(
          q,
          ct.contractNumber,
          ct.title,
          ct.clientName,
          ct.otherPartyName,
          ct.lawyerName,
          ct.fileNumber,
          ct.otherContractType,
          'عقد عقود العقود contract contracts'
        )
      ) {
        results.push({
          id: `contract-${ct.id}`,
          category: 'Contracts',
          categoryLabelKey: 'SIDEBAR.CONTRACTS',
          icon: 'pi pi-file-edit',
          badgeClass: 'bg-purple-100 text-purple-700',
          code: ct.contractNumber,
          title: ct.title,
          subtitle: ct.clientName,
          route: ['/contracts'],
          queryParams: { search: ct.contractNumber }
        });
      }
      if (results.length >= 18) break;
    }

    for (const r of this.cachedRegistrations()) {
      if (
        this.matchesSearch(
          q,
          r.registrationNumber,
          r.authorityName,
          r.clientName,
          r.lawyerName,
          r.fileNumber,
          r.resultNumber,
          r.otherRequestType,
          'شهر عقاري الشهر العقاري تسجيل registration registrations'
        )
      ) {
        results.push({
          id: `reg-${r.id}`,
          category: 'Registrations',
          categoryLabelKey: 'SIDEBAR.REGISTRATIONS',
          icon: 'pi pi-building',
          badgeClass: 'bg-amber-100 text-amber-700',
          code: r.registrationNumber,
          title: r.authorityName,
          subtitle: r.clientName,
          route: ['/registrations'],
          queryParams: { search: r.registrationNumber }
        });
      }
      if (results.length >= 20) break;
    }

    for (const co of this.cachedCompanies()) {
      if (
        this.matchesSearch(
          q,
          co.companyCode,
          co.title,
          co.companyNumber,
          co.clientName,
          co.lawyerName,
          co.taxNumber,
          co.fileNumber,
          co.otherCompanyType,
          'شركة شركات الشركات company companies'
        )
      ) {
        results.push({
          id: `company-${co.id}`,
          category: 'Companies',
          categoryLabelKey: 'SIDEBAR.COMPANIES',
          icon: 'pi pi-building-columns',
          badgeClass: 'bg-indigo-100 text-indigo-700',
          code: co.companyCode,
          title: co.title,
          subtitle: co.clientName,
          route: ['/companies'],
          queryParams: { search: co.companyCode }
        });
      }
      if (results.length >= 22) break;
    }

    for (const s of this.cachedSessions()) {
      if (
        this.matchesSearch(
          q,
          s.title,
          s.caseNumber,
          s.caseTitle,
          s.courtName,
          s.location,
          s.circuitNumber,
          s.assignedLawyerName,
          s.decisionText,
          'جلسة جلسات الجلسات محكمة session sessions'
        )
      ) {
        results.push({
          id: `session-${s.id}`,
          category: 'Sessions',
          categoryLabelKey: 'SIDEBAR.SESSIONS',
          icon: 'pi pi-calendar',
          badgeClass: 'bg-orange-100 text-orange-700',
          code: s.caseNumber,
          title: s.title || s.courtName,
          subtitle: s.courtName,
          route: ['/cases', s.caseId]
        });
      }
      if (results.length >= 25) break;
    }

    return results.slice(0, 12);
  });

  canViewSystemNotifications = computed(() =>
    this.authService.hasPermission('Settings.Manage') ||
    this.authService.hasPermission('Users.View')
  );

  displayedNotifications = computed(() => {
    if (!this.canViewSystemNotifications()) {
      return this.notificationService.notifications();
    }
    return this.notifScopeTab() === 'system'
      ? this.notificationService.systemNotifications()
      : this.notificationService.personalNotifications();
  });

  constructor() {
    // Refresh menu items when language changes or user logs in/changes role
    this.translate.onLangChange.subscribe(() => this.updateMenuItems());
    effect(() => {
      const user = this.authService.currentUser();
      this.searchIndexLoaded = false;
      this.updateMenuItems();
    });
    effect(() => {
      const personalCount = this.notificationService.personalNotifications().length;
      const systemCount = this.notificationService.systemNotifications().length;
      if (personalCount === 0 && systemCount > 0 && this.canViewSystemNotifications()) {
        this.notifScopeTab.set('system');
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.searchOpen.set(false);
    }
  }

  async ensureSearchIndex(force = false) {
    if ((!force && this.searchIndexLoaded) || this.searchLoading()) return;
    if (!this.searchIndexLoaded) {
      this.searchLoading.set(true);
    }
    try {
      const tasks: Promise<void>[] = [];
      if (this.authService.hasPermission('Cases.View')) {
        tasks.push(this.caseService.getCases().then(res => this.cachedCases.set(res)).catch(() => {}));
      }
      if (this.authService.hasPermission('Clients.View')) {
        tasks.push(this.clientService.getClients().then(res => this.cachedClients.set(res)).catch(() => {}));
      }
      if (this.authService.hasPermission('Contracts.View')) {
        tasks.push(this.contractService.getContracts().then(res => this.cachedContracts.set(res)).catch(() => {}));
      }
      if (this.authService.hasPermission('Registrations.View')) {
        tasks.push(this.registrationService.getRegistrations().then(res => this.cachedRegistrations.set(res)).catch(() => {}));
      }
      if (this.authService.hasPermission('Companies.View')) {
        tasks.push(this.companyService.getCompanies().then(res => this.cachedCompanies.set(res)).catch(() => {}));
      }
      if (this.authService.hasPermission('Sessions.View')) {
        tasks.push(this.sessionService.getSessions().then(res => this.cachedSessions.set(res)).catch(() => {}));
      }
      await Promise.all(tasks);
      this.searchIndexLoaded = true;
    } finally {
      this.searchLoading.set(false);
    }
  }

  async onSearchFocus() {
    this.searchOpen.set(true);
    await this.ensureSearchIndex(true);
  }

  async onSearchInput(value: string) {
    this.searchQuery.set(value);
    this.searchOpen.set(true);
    if (!this.searchIndexLoaded) {
      await this.ensureSearchIndex();
    }
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchOpen.set(false);
  }

  selectSearchResult(item: GlobalSearchResult) {
    this.searchOpen.set(false);
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(item.route, item.queryParams ? { queryParams: item.queryParams } : undefined);
    });
  }

  onSearchEnter() {
    const first = this.searchResults()[0];
    if (first) {
      this.selectSearchResult(first);
    }
  }

  updateMenuItems() {
    this.profileMenuItems = [
      {
        label: this.translate.instant('PROFILE.VIEW_PROFILE'),
        icon: 'pi pi-user',
        routerLink: '/profile'
      },
      {
        label: this.translate.instant('USERS.ADMIN_TAB_TITLE'),
        icon: 'pi pi-users',
        command: () => this.router.navigate(['/profile'], { queryParams: { tab: 'users' } }),
        visible: this.authService.hasPermission('Users.View')
      },
      {
        separator: true
      },
      {
        label: this.translate.instant('PROFILE.LOGOUT'),
        icon: 'pi pi-sign-out',
        command: () => this.confirmLogout()
      }
    ];
  }

  confirmLogout() {
    this.confirmationService.confirm({
      header: this.translate.instant('PROFILE.LOGOUT_CONFIRM_TITLE'),
      message: this.translate.instant('PROFILE.LOGOUT_CONFIRM_MESSAGE'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.authService.logout();
      }
    });
  }

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user || !user.fullName) return 'U';
    
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }

  getRoleLabel(role?: string): string {
    const user = this.authService.currentUser();
    const roles = user?.roles && user.roles.length > 0 ? user.roles : [role || 'Lawyer'];
    const keyMap: { [key: string]: string } = {
      'Admin': 'USERS.ROLES.ADMIN',
      'Lawyer': 'USERS.ROLES.LAWYER',
      'Receptionist': 'USERS.ROLES.RECEPTIONIST',
      'Accountant': 'USERS.ROLES.ACCOUNTANT'
    };
    return roles.map(r => keyMap[r] ? this.translate.instant(keyMap[r]) : r).join(' • ');
  }

  onNotificationClick(notification: NotificationDto, op: any) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id);
    }
    op.hide();
    const targetUrl = notification.link ? notification.link : '/cases';
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(targetUrl);
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }
}
