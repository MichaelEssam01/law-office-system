import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { DocumentService, DocumentDto, DocumentCategory } from '../../../core/services/document.service';
import { CaseService, CaseListDto } from '../../../core/services/case.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AppStateService } from '../../../core/services/app-state.service';

@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TooltipModule,
    FormsModule,
    ToastModule,
    ConfirmDialogModule,
    TranslateModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './documents-page.html',
  styleUrl: './documents-page.css',
  providers: [MessageService, ConfirmationService]
})
export class DocumentsPage implements OnInit {
  public appState = inject(AppStateService);
  public cdr = inject(ChangeDetectorRef);
  private caseService = inject(CaseService);

  allDocuments = signal<DocumentDto[]>([]);
  documents = signal<DocumentDto[]>([]);
  loading = signal<boolean>(true);
  cases = signal<{ id: string; caseNumber: string; title: string }[]>([]);

  searchTerm = signal<string>('');
  selectedCategory = signal<number | null>(null);
  selectedCase = signal<string | null>(null);

  categoryOptions = [
    { label: DocumentCategory.Contract, value: DocumentCategory.Contract },
    { label: DocumentCategory.CourtDocument, value: DocumentCategory.CourtDocument },
    { label: DocumentCategory.Evidence, value: DocumentCategory.Evidence },
    { label: DocumentCategory.Invoice, value: DocumentCategory.Invoice },
    { label: DocumentCategory.Other, value: DocumentCategory.Other }
  ];

  constructor(
    private documentService: DocumentService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  async ngOnInit() {
    await Promise.all([
      this.loadDocuments(),
      this.loadCases()
    ]);
  }

  async loadCases() {
    try {
      const data = await this.caseService.getCases();
      this.cases.set(data.map((c: CaseListDto) => ({ id: c.id, caseNumber: c.caseNumber, title: c.title })));
    } catch (e) {
      console.error('Failed to load cases for filter', e);
    }
  }

  async loadDocuments() {
    this.loading.set(true);
    try {
      const data = await this.documentService.getAllDocuments();
      this.allDocuments.set(data);
      this.applyFilters();
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('CASES.LOAD_ERROR') });
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters() {
    let filtered = [...this.allDocuments()];

    if (this.selectedCategory() !== null && this.selectedCategory() !== undefined) {
      filtered = filtered.filter(d => d.category === this.selectedCategory());
    }

    if (this.selectedCase()) {
      filtered = filtered.filter(d => d.caseId === this.selectedCase());
    }

    this.documents.set(filtered);
    this.cdr.detectChanges();
  }

  resetFilters() {
    this.searchTerm.set('');
    this.selectedCategory.set(null);
    this.selectedCase.set(null);
    this.applyFilters();
  }

  getCategoryLabel(category: DocumentCategory): string {
    switch (category) {
      case DocumentCategory.Contract: return this.translate.instant('DOCUMENTS.CONTRACT');
      case DocumentCategory.CourtDocument: return this.translate.instant('DOCUMENTS.COURT');
      case DocumentCategory.Evidence: return this.translate.instant('DOCUMENTS.EVIDENCE');
      case DocumentCategory.Invoice: return this.translate.instant('DOCUMENTS.INVOICE');
      default: return this.translate.instant('DOCUMENTS.OTHER');
    }
  }

  async download(doc: DocumentDto) {
    try {
      await this.documentService.downloadDocument(doc.id, doc.originalFileName);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('CASES.DOWNLOAD_ERROR') });
    }
  }

  async delete(doc: DocumentDto) {
    this.confirmationService.confirm({
      message: this.translate.instant('CASES.DELETE_CONFIRM_MESSAGE', { caseNumber: doc.originalFileName }),
      header: this.translate.instant('CASES.DELETE_CONFIRM_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('CASES.DELETE_ACCEPT'),
      rejectLabel: this.translate.instant('COMMON.CANCEL'),
      accept: async () => {
        try {
          await this.documentService.deleteDocument(doc.id);
          this.messageService.add({ severity: 'success', summary: this.translate.instant('COMMON.SUCCESS'), detail: this.translate.instant('CASES.DELETE_SUCCESS') });
          await this.loadDocuments();
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: this.translate.instant('COMMON.ERROR'), detail: this.translate.instant('CASES.DELETE_ERROR') });
        }
      }
    });
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
