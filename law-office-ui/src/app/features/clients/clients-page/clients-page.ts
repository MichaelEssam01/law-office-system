import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClientService, Client } from '../../../core/services/client';
import { ClientDialog } from '../client-dialog/client-dialog';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    ClientDialog
  ],
  templateUrl: './clients-page.html',
  styleUrl: './clients-page.css'
})
export class ClientsPage implements OnInit {
  clients: Client[] = [];
  selectedClient: Client | null = null;
  displayDialog: boolean = false;
  loading: boolean = true;

  constructor(
    private clientService: ClientService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadClients();
  }

  async loadClients() {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      this.clients = await this.clientService.getClients();
    } catch (err) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحميل العملاء' });
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  openNew() {
    this.selectedClient = null;
    this.displayDialog = true;
  }

  editClient(client: Client) {
    this.selectedClient = { ...client };
    this.displayDialog = true;
  }

  deleteClient(client: Client) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف العميل ${client.fullName}؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        if (client.id) {
          try {
            await this.clientService.deleteClient(client.id);
            this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف العميل بنجاح' });
            await this.loadClients();
          } catch (err) {
            this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حذف العميل' });
          }
        }
      }
    });
  }

  onDialogHide() {
    this.displayDialog = false;
  }

  async onSave(client: Client) {
    try {
      if (client.id) {
        await this.clientService.updateClient(client.id, client);
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث العميل بنجاح' });
      } else {
        await this.clientService.createClient(client);
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم إضافة العميل بنجاح' });
      }
      await this.loadClients();
      this.displayDialog = false;
    } catch (err) {
      this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في معالجة الطلب' });
    }
  }
}
