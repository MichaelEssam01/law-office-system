import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CaseService, CaseListDto, CaseStatus, CaseDetailDto } from '../../../core/services/case.service';
import { ClientService, Client } from '../../../core/services/client';
import { CaseDialog } from '../case-dialog/case-dialog';

@Component({
  selector: 'app-cases-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule, 
    ButtonModule, 
    InputTextModule, 
    TagModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    ConfirmDialogModule,
    SelectModule,
    CaseDialog
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './cases-page.html'
})
export class CasesPage implements OnInit {
  private caseService = inject(CaseService);
  private clientService = inject(ClientService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  cases = signal<CaseListDto[]>([]);
  loading = signal(true);
  
  displayDialog = signal(false);
  selectedCase = signal<CaseDetailDto | null>(null);

  // Filters
  searchTerm = signal('');
  selectedStatus = signal<string | null>(null);
  selectedClient = signal<string | null>(null);
  selectedLawyer = signal<string | null>(null);

  clients = signal<Client[]>([]);
  lawyers = signal<any[]>([
    { fullName: 'المحامي المسؤول (Admin)', id: '00000000-0000-0000-0000-000000000000' }
  ]);
  
  statuses = [
    { label: 'مفتوحة', value: '0' },
    { label: 'قيد الانتظار', value: '1' },
    { label: 'مغلقة', value: '2' }
  ];

  async ngOnInit() {
    await Promise.all([
      this.loadCases(),
      this.loadFilterData()
    ]);
  }

  async loadFilterData() {
    try {
      this.clients.set(await this.clientService.getClients());
    } catch (error) {
      console.error('Error loading filter data', error);
    }
  }

  async loadCases() {
    this.loading.set(true);
    try {
      const filters = {
        status: this.selectedStatus() || undefined,
        clientId: this.selectedClient() || undefined,
        lawyerId: this.selectedLawyer() || undefined
      };
      const data = await this.caseService.getCases(filters);
      this.cases.set(data);
    } catch (error) {
      console.error('Error loading cases', error);
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحميل القضايا' });
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  async onFilterChange() {
    await this.loadCases();
  }

  async resetFilters() {
    this.searchTerm.set('');
    this.selectedStatus.set(null);
    this.selectedClient.set(null);
    this.selectedLawyer.set(null);
    await this.loadCases();
  }

  openNew() {
    this.selectedCase.set(null);
    this.displayDialog.set(true);
  }

  async editCase(caseItem: CaseListDto) {
    try {
      const fullCase = await this.caseService.getCaseById(caseItem.id);
      this.selectedCase.set(fullCase);
      this.displayDialog.set(true);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحميل تفاصيل القضية' });
    }
  }

  deleteCase(caseItem: CaseListDto) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف القضية رقم ${caseItem.caseNumber}؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، احذف',
      rejectLabel: 'إلغاء',
      accept: async () => {
        try {
          await this.caseService.deleteCase(caseItem.id);
          this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف القضية بنجاح' });
          await this.loadCases();
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حذف القضية' });
        }
      }
    });
  }

  async onSave(caseData: any) {
    try {
      if (caseData.id) {
        await this.caseService.updateCase(caseData.id, caseData);
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث القضية بنجاح' });
      } else {
        await this.caseService.createCase(caseData);
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم إضافة القضية بنجاح' });
      }
      this.displayDialog.set(false);
      await this.loadCases();
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حفظ القضية' });
    }
  }

  getStatusSeverity(status: CaseStatus): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case CaseStatus.Open: return 'info';
      case CaseStatus.Pending: return 'warn';
      case CaseStatus.Closed: return 'success';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: CaseStatus): string {
    switch (status) {
      case CaseStatus.Open: return 'مفتوحة';
      case CaseStatus.Pending: return 'قيد الانتظار';
      case CaseStatus.Closed: return 'مغلقة';
      default: return 'غير معروف';
    }
  }
}
