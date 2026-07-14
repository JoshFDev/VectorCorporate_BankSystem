import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  amount?: number;
  accountNumber?: string;
  relatedAccount?: string;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = environment.apiUrl;
  private unreadSubject = new BehaviorSubject<number>(0);
  unread$ = this.unreadSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotifications(page = 1, limit = 20): Observable<{ notifications: Notification[]; total: number; page: number; pages: number }> {
    return this.http.get<any>(`${this.api}/notifications?page=${page}&limit=${limit}`);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.api}/notifications/unread-count`).pipe(
      tap(res => this.unreadSubject.next(res.count))
    );
  }

  markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.api}/notifications/${id}/read`, {}).pipe(
      tap(() => {
        const current = this.unreadSubject.value;
        this.unreadSubject.next(Math.max(0, current - 1));
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.api}/notifications/read-all`, {}).pipe(
      tap(() => this.unreadSubject.next(0))
    );
  }

  updateUnread(count: number): void {
    this.unreadSubject.next(count);
  }

  incrementUnread(): void {
    this.unreadSubject.next(this.unreadSubject.value + 1);
  }
}
