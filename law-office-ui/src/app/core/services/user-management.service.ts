import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface UserListDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserDetailDto extends UserListDto {
  permissions: string[];
}

export interface CreateUserDto {
  fullName: string;
  email: string;
  password?: string;
  role: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5137/api/users';

  async getUsers(): Promise<UserListDto[]> {
    return firstValueFrom(this.http.get<UserListDto[]>(this.apiUrl));
  }

  async getLawyers(): Promise<UserListDto[]> {
    return firstValueFrom(this.http.get<UserListDto[]>(`${this.apiUrl}/lawyers`));
  }

  async getUser(id: string): Promise<UserDetailDto> {
    return firstValueFrom(this.http.get<UserDetailDto>(`${this.apiUrl}/${id}`));
  }

  async getAvailablePermissions(): Promise<string[]> {
    return firstValueFrom(this.http.get<string[]>(`${this.apiUrl}/permissions`));
  }

  async createUser(data: CreateUserDto): Promise<UserDetailDto> {
    return firstValueFrom(this.http.post<UserDetailDto>(this.apiUrl, data));
  }

  async updateUser(id: string, data: any): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.apiUrl}/${id}`, data));
  }

  async deleteUser(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}
