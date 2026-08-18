import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export enum InvoiceStatus {
  Unpaid = 0,
  PartiallyPaid = 1,
  Paid = 2,
  Overdue = 3,
  Cancelled = 4
}

export enum PaymentMethod {
  Cash = 0,
  BankTransfer = 1,
  CreditCard = 2,
  Check = 3,
  Other = 4
}

export interface InvoiceListDto {
  id: string;
  caseId: string;
  clientId?: string;
  clientName?: string;
  caseNumber: string;
  caseTitle: string;
  invoiceNumber: string;
  title: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: string;
}

export interface PaymentListDto {
  id: string;
  caseId: string;
  caseNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  notes?: string;
}

export interface FinancialSummaryDto {
  totalInvoiced: number;
  totalPaid: number;
  totalRemaining: number;
  totalCancelled: number;
  unpaidInvoicesCount: number;
  overdueInvoicesCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5137/api';

  // Invoices
  async getInvoices(caseId?: string, status?: number): Promise<InvoiceListDto[]> {
    let params = new HttpParams().set('_t', new Date().getTime().toString());
    if (caseId) params = params.set('caseId', caseId);
    if (status !== undefined) params = params.set('status', status.toString());
    
    return firstValueFrom(this.http.get<InvoiceListDto[]>(`${this.baseUrl}/invoices`, { params }));
  }

  async getInvoiceById(id: string): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.baseUrl}/invoices/${id}`));
  }

  async createInvoice(data: any): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.baseUrl}/invoices`, data));
  }

  async updateInvoice(id: string, data: any): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.baseUrl}/invoices/${id}`, data));
  }

  async deleteInvoice(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/invoices/${id}`));
  }

  // Payments
  async getPayments(caseId?: string, invoiceId?: string): Promise<PaymentListDto[]> {
    let params = new HttpParams().set('_t', new Date().getTime().toString());
    if (caseId) params = params.set('caseId', caseId);
    if (invoiceId) params = params.set('invoiceId', invoiceId);
    
    return firstValueFrom(this.http.get<PaymentListDto[]>(`${this.baseUrl}/payments`, { params }));
  }

  async getPaymentsByInvoice(invoiceId: string): Promise<PaymentListDto[]> {
    const params = new HttpParams().set('invoiceId', invoiceId).set('_t', new Date().getTime().toString());
    return firstValueFrom(this.http.get<PaymentListDto[]>(`${this.baseUrl}/payments`, { params }));
  }

  async getPaymentById(id: string): Promise<PaymentListDto> {
    return firstValueFrom(this.http.get<PaymentListDto>(`${this.baseUrl}/payments/${id}`));
  }

  async createPayment(data: any): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.baseUrl}/payments`, data));
  }

  async updatePayment(id: string, data: any): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.baseUrl}/payments/${id}`, data));
  }

  async deletePayment(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/payments/${id}`));
  }

  // Summary
  async getGlobalSummary(): Promise<FinancialSummaryDto> {
    return firstValueFrom(this.http.get<FinancialSummaryDto>(`${this.baseUrl}/finance/summary`));
  }

  async getCaseSummary(caseId: string): Promise<FinancialSummaryDto> {
    let params = new HttpParams().set('_t', new Date().getTime().toString());
    return firstValueFrom(this.http.get<FinancialSummaryDto>(`${this.baseUrl}/finance/summary/${caseId}`, { params }));
  }
}
