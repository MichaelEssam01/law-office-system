import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, tap } from 'rxjs';

export interface User {
  fullName: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  expiration: string;
  fullName: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface UserInfo {
  fullName: string;
  email: string;
  role: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:5137/api/auth';

  private _currentUser = signal<User | null>(null);
  private _permissions = signal<string[]>([]);
  
  public currentUser = computed(() => this._currentUser());
  public permissions = computed(() => this._permissions());
  public isAuthenticated = computed(() => !!this._currentUser());

  /**
   * Check if user has a specific permission or role
   */
  public hasPermission(permission: string): boolean {
    const user = this._currentUser();
    const permissions = this._permissions();
    
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return permissions.includes(permission);
  }

  constructor() {
    // Session restoration is now handled by APP_INITIALIZER calling validateSession()
  }

  /**
   * Called on app startup to validate session and restore user state.
   * If /me fails with 401, it tries refresh-token once before giving up.
   */
  async validateSession(): Promise<boolean> {
    try {
      // First attempt to get current user
      const userInfo = await this.me();
      return !!userInfo;
    } catch (error: any) {
      // If unauthorized, try to refresh once
      if (error.status === 401) {
        try {
          await firstValueFrom(this.refreshToken());
          const userInfo = await this.me();
          return !!userInfo;
        } catch {
          this.clearLocalState();
          return false;
        }
      }
      // For any other error (e.g. server down), just clear and continue
      this.clearLocalState();
      return false;
    }
  }

  async login(credentials: any): Promise<AuthResponse> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
    );
    
    const user: User = {
      fullName: response.fullName,
      email: response.email,
      role: response.role
    };
    
    this._currentUser.set(user);
    this._permissions.set(response.permissions || []);
    
    return response;
  }

  async me(): Promise<UserInfo | null> {
    const userInfo = await firstValueFrom(
      this.http.get<UserInfo>(`${this.apiUrl}/me`)
    );
    
    if (!userInfo) return null;

    const user: User = {
      fullName: userInfo.fullName,
      email: userInfo.email,
      role: userInfo.role
    };
    this._currentUser.set(user);
    this._permissions.set(userInfo.permissions || []);
    return userInfo;
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, {}).pipe(
      tap(response => {
        const user: User = {
          fullName: response.fullName,
          email: response.email,
          role: response.role
        };
        this._currentUser.set(user);
        this._permissions.set(response.permissions || []);
      })
    );
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.clearLocalState(),
      error: () => this.clearLocalState()
    });
  }

  clearLocalState() {
    this._currentUser.set(null);
    this._permissions.set([]);
    const currentUrl = this.router.url;
    if (!currentUrl.includes('/login') && !currentUrl.includes('/forgot-password') && !currentUrl.includes('/reset-password')) {
      this.router.navigate(['/login']);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    await firstValueFrom(this.http.post(`${this.apiUrl}/forgot-password`, { email }));
  }

  async resetPassword(data: any): Promise<void> {
    await firstValueFrom(this.http.post(`${this.apiUrl}/reset-password`, data));
  }
}
