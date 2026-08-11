import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  parameters?: { [key: string]: string };
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:5137/api/notifications';
  private hubUrl = 'http://localhost:5137/hubs/notifications';
  private hubConnection?: HubConnection;

  notifications = signal<NotificationDto[]>([]);
  unreadCount = signal<number>(0);

  constructor() {
    // Re-establish connection when user changes
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.startConnection();
        this.loadInitialData();
      } else {
        this.stopConnection();
        this.notifications.set([]);
        this.unreadCount.set(0);
      }
    });
  }

  private async loadInitialData() {
    try {
      const [notifications, { count }] = await Promise.all([
        this.getNotifications(10),
        this.getUnreadCount()
      ]);
      this.notifications.set(notifications);
      this.unreadCount.set(count);
    } catch (error) {
      console.error('Error loading initial notifications:', error);
    }
  }

  private startConnection() {
    if (this.hubConnection) return;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection.on('ReceiveNotification', (notification: NotificationDto) => {
      this.notifications.update(prev => [notification, ...prev].slice(0, 20));
      this.unreadCount.update(count => count + 1);
    });

    this.hubConnection.start().catch(err => console.error('SignalR Connection Error: ', err));
  }

  private stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = undefined;
    }
  }

  async getNotifications(count: number = 20): Promise<NotificationDto[]> {
    return firstValueFrom(this.http.get<NotificationDto[]>(`${this.apiUrl}?count=${count}`));
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return firstValueFrom(this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`));
  }

  async markAsRead(id: string): Promise<void> {
    await firstValueFrom(this.http.post(`${this.apiUrl}/${id}/read`, {}));
    this.notifications.update(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    this.unreadCount.update(count => Math.max(0, count - 1));
  }

  async markAllAsRead(): Promise<void> {
    await firstValueFrom(this.http.post(`${this.apiUrl}/read-all`, {}));
    this.notifications.update(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    this.unreadCount.set(0);
  }
}
