import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { AppStateService } from '../../../core/services/app-state.service';
import { ClientService, Client, ClientWorks } from '../../../core/services/client';
import { ClientDialog } from '../client-dialog/client-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    ClientDialog,
    TranslateModule,
    IconFieldModule,
    InputIconModule,
    TabsModule,
    TagModule,
    TooltipModule,
    RippleModule
  ],
  templateUrl: './clients-page.html',
  styleUrl: './clients-page.css',
  providers: [MessageService, ConfirmationService]
})
export class ClientsPage implements OnInit {
  clients: Client[] = [];
  selectedClient: Client | null = null;
  displayDialog: boolean = false;
  loading: boolean = true;

  displayWorksDialog: boolean = false;
  clientWorks: ClientWorks | null = null;
  loadingWorks: boolean = false;

  constructor(
    private clientService: ClientService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public cdr: ChangeDetectorRef,
    private translate: TranslateService,
    public appState: AppStateService
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
      this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('COMMON.ERROR'), 
        detail: this.translate.instant('CLIENTS.LOAD_ERROR') 
      });
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
      message: this.translate.instant('CLIENTS.DELETE_CONFIRM_MESSAGE', { name: client.fullName }),
      header: this.translate.instant('CLIENTS.DELETE_CONFIRM_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('COMMON.YES'),
      rejectLabel: this.translate.instant('COMMON.NO'),
      accept: async () => {
        if (client.id) {
          try {
            await this.clientService.deleteClient(client.id);
            this.messageService.add({ 
              severity: 'success', 
              summary: this.translate.instant('COMMON.SUCCESS'), 
              detail: this.translate.instant('CLIENTS.DELETE_SUCCESS') 
            });
            await this.loadClients();
          } catch (err) {
            this.messageService.add({ 
              severity: 'error', 
              summary: this.translate.instant('COMMON.ERROR'), 
              detail: this.translate.instant('CLIENTS.DELETE_ERROR') 
            });
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
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('CLIENTS.UPDATE_SUCCESS') 
        });
      } else {
        await this.clientService.createClient(client);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('COMMON.SUCCESS'), 
          detail: this.translate.instant('CLIENTS.CREATE_SUCCESS') 
        });
      }
      this.displayDialog = false;
      await this.loadClients();
    } catch (err: any) {
      if (err.error && err.error.message === 'NATIONAL_ID_EXISTS') {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translate.instant('COMMON.ERROR'), 
          detail: this.translate.instant('CLIENTS.NATIONAL_ID_EXISTS') 
        });
      } else {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translate.instant('COMMON.ERROR'), 
          detail: this.translate.instant('CLIENTS.SAVE_ERROR') 
        });
      }
    }
  }

  async viewClientWorks(client: Client) {
    if (!client.id) return;
    this.selectedClient = client;
    this.displayWorksDialog = true;
    this.loadingWorks = true;
    this.clientWorks = null;
    this.cdr.detectChanges();

    try {
      this.clientWorks = await this.clientService.getClientWorks(client.id);
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('COMMON.ERROR'),
        detail: this.translate.instant('CLIENTS.LOAD_ERROR')
      });
    } finally {
      this.loadingWorks = false;
      this.cdr.detectChanges();
    }
  }
}
