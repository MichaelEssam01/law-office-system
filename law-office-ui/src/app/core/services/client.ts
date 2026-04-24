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
