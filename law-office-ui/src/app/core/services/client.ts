import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Client {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  nationalId: string;
}

export interface ClientCaseSummary {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  lawyerName: string;
  startDate: string;
}

export interface ClientSessionSummary {
  id: string;
  caseId: string;
  caseNumber: string;
  title: string;
  scheduledAt: string;
  courtName: string;
  status: string;
}

export interface ClientPaymentSummary {
  id: string;
  amount: number;
  paymentDate: string;
  method: string;
  notes?: string;
}

export interface ClientInvoiceSummary {
  id: string;
  caseId: string;
  caseNumber: string;
  invoiceNumber: string;
  title: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: string;
  payments: ClientPaymentSummary[];
}

export interface ClientDocumentSummary {
  id: string;
  caseId: string;
  caseNumber: string;
  originalFileName: string;
  category: string;
  fileSize: number;
  createdAt: string;
}

export interface ClientWorks {
  client: Client;
  cases: ClientCaseSummary[];
  sessions: ClientSessionSummary[];
  invoices: ClientInvoiceSummary[];
  documents: ClientDocumentSummary[];
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5137/api/clients';

  async getClients(): Promise<Client[]> {
    return firstValueFrom(this.http.get<Client[]>(this.apiUrl));
  }

  async getClient(id: string): Promise<Client> {
    return firstValueFrom(this.http.get<Client>(`${this.apiUrl}/${id}`));
  }

  async getClientWorks(id: string): Promise<ClientWorks> {
    return firstValueFrom(this.http.get<ClientWorks>(`${this.apiUrl}/${id}/works`));
  }

  async createClient(client: Client): Promise<Client> {
    return firstValueFrom(this.http.post<Client>(this.apiUrl, client));
  }

  async updateClient(id: string, client: Client): Promise<any> {
    return firstValueFrom(this.http.put(`${this.apiUrl}/${id}`, client));
  }

  async deleteClient(id: string): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
  }
}
