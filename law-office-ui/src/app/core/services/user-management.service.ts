import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface UserListDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  roles?: string[];
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
  roles?: string[];
  permissions?: string[];
}

export interface RolePermissionsDto {
  role: string;
  permissions: string[];
  usersCount: number;
  isSystemRole?: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  Lawyer: [
    'Clients.View',
    'Cases.View', 'Cases.Create', 'Cases.Update',
    'Contracts.View', 'Contracts.Create', 'Contracts.Update',
    'Registrations.View', 'Registrations.Create', 'Registrations.Update',
    'Companies.View', 'Companies.Create', 'Companies.Update',
    'Sessions.View', 'Sessions.Create', 'Sessions.Update',
    'Documents.View', 'Documents.Upload'
  ],
  Receptionist: [
    'Clients.View', 'Clients.Create', 'Clients.Update',
    'Cases.View', 'Cases.Create',
    'Contracts.View', 'Contracts.Create',
    'Registrations.View', 'Registrations.Create',
    'Companies.View', 'Companies.Create',
    'Sessions.View', 'Sessions.Create',
    'Documents.View', 'Documents.Upload'
  ],
  Accountant: [
    'Finance.View', 'Finance.Manage',
    'Clients.View',
    'Cases.View',
    'Contracts.View',
    'Registrations.View',
    'Companies.View'
  ]
};

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

  async getRoles(): Promise<RolePermissionsDto[]> {
    return firstValueFrom(this.http.get<RolePermissionsDto[]>(`${this.apiUrl}/roles`));
  }

  async createRole(roleName: string, permissions: string[] = []): Promise<RolePermissionsDto> {
    return firstValueFrom(this.http.post<RolePermissionsDto>(`${this.apiUrl}/roles`, { roleName, permissions }));
  }

  async updateRolePermissions(roleName: string, permissions: string[]): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.apiUrl}/roles/${encodeURIComponent(roleName)}/permissions`, { permissions }));
  }

  async deleteRole(roleName: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/roles/${encodeURIComponent(roleName)}`));
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
