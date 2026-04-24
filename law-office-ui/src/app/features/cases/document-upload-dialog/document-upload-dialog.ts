import { Component, Input, Output, EventEmitter, inject, signal, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule, FileUploadHandlerEvent } from 'primeng/fileupload';
import { DocumentService, DocumentCategory } from '../../../core/services/document.service';

@Component({
  selector: 'app-document-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    SelectModule,
    TextareaModule,
    FileUploadModule
  ],
  templateUrl: './document-upload-dialog.html'
})
export class DocumentUploadDialog {
  private fb = inject(FormBuilder);
  private documentService = inject(DocumentService);

  visible = model<boolean>(false);
  @Input() caseId = signal<string | null>(null);
  @Output() onUpload = new EventEmitter<void>();

  uploadForm: FormGroup;
  uploading = signal(false);
  selectedFile: File | null = null;

  categories = [
    { label: 'عقد', value: DocumentCategory.Contract },
    { label: 'وثيقة محكمة', value: DocumentCategory.CourtDocument },
    { label: 'دليل', value: DocumentCategory.Evidence },
    { label: 'فاتورة', value: DocumentCategory.Invoice },
    { label: 'أخرى', value: DocumentCategory.Other }
  ];

  allowedTypes = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
  maxSize = 10000000; // 10MB

  constructor() {
    this.uploadForm = this.fb.group({
      category: [DocumentCategory.Other, Validators.required],
      description: ['']
    });
  }

  onFileSelect(event: any) {
    this.selectedFile = event.files[0];
  }

  onFileRemove() {
    this.selectedFile = null;
  }

  async save() {
    if (this.uploadForm.invalid || !this.selectedFile || !this.caseId()) {
      return;
    }

    this.uploading.set(true);
    try {
      const { category, description } = this.uploadForm.value;
      await this.documentService.uploadDocument(
        this.caseId()!,
        this.selectedFile,
        category,
        description
      );
      this.onUpload.emit();
      this.close();
    } catch (error) {
      console.error('Upload failed', error);
      // Error handling is managed by the parent via Toast
    } finally {
      this.uploading.set(false);
    }
  }

  close() {
    this.visible.set(false);
    this.uploadForm.reset({ category: DocumentCategory.Other });
    this.selectedFile = null;
  }
}
