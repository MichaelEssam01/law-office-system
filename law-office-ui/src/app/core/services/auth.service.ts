import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export interface User {
  fullName: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  fullName: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:5137/api/auth';

  private _currentUser = signal<User | null>(null);
  public currentUser = computed(() => this._currentUser());
  public isAuthenticated = computed(() => !!this._currentUser());

  constructor() {
    this.bootstrap();
  }

  private bootstrap() {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      this._currentUser.set(JSON.parse(savedUser));
    }
  }

  async login(credentials: any): Promise<AuthResponse> {
    const response = await firstValueFrom(this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials));
    
    localStorage.setItem('token', response.token);
    const user: User = {
      fullName: response.fullName,
      email: response.email,
      role: response.role
    };
    localStorage.setItem('user', JSON.stringify(user));
    this._currentUser.set(user);
    
    return response;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
