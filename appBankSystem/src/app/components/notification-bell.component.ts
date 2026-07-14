import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bell-wrapper" (click)="toggleDropdown($event)">
      <button class="bell-btn" [class.has-unread]="unreadCount > 0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>

      <div class="dropdown" *ngIf="open" (click)="$event.stopPropagation()">
        <div class="dropdown-header">
          <h3>Notificaciones</h3>
          <button class="mark-all" *ngIf="notifications.length > 0" (click)="markAllRead()">Marcar todas leidas</button>
        </div>
        <div class="dropdown-list" *ngIf="notifications.length > 0">
          <div *ngFor="let n of notifications" class="notif-item" [class.unread]="!n.read" (click)="onNotificationClick(n)">
            <div class="notif-icon" [ngClass]="'type-' + n.type">
              <svg *ngIf="n.type === 'deposit'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><polyline points="5 12 12 5 19 12"/></svg>
              <svg *ngIf="n.type === 'withdrawal'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><polyline points="19 12 12 19 5 12"/></svg>
              <svg *ngIf="n.type === 'transfer_in'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/></svg>
              <svg *ngIf="n.type === 'transfer_out'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
              <svg *ngIf="n.type === 'system' || n.type === 'security'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <div class="notif-body">
              <div class="notif-title">{{ n.title }}</div>
              <div class="notif-message">{{ n.message }}</div>
              <div class="notif-time">{{ getTimeAgo(n.createdAt) }}</div>
            </div>
            <div class="notif-amount" *ngIf="n.amount" [class.positive]="n.type === 'deposit' || n.type === 'transfer_in'" [class.negative]="n.type === 'withdrawal' || n.type === 'transfer_out'">
              {{ (n.type === 'deposit' || n.type === 'transfer_in') ? '+' : '-' }} Q{{ n.amount.toFixed(2) }}
            </div>
          </div>
        </div>
        <div class="dropdown-empty" *ngIf="notifications.length === 0">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <p>No hay notificaciones</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bell-wrapper { position: relative; }
    .bell-btn {
      background: none; border: none; cursor: pointer; padding: 8px;
      color: #64748b; border-radius: 8px; position: relative; transition: all 0.2s;
    }
    .bell-btn:hover { background: #f1f5f9; color: #1e293b; }
    .bell-btn.has-unread { color: #1e40af; }
    .badge {
      position: absolute; top: 2px; right: 2px; min-width: 18px; height: 18px;
      background: #dc2626; color: #fff; font-size: 10px; font-weight: 700;
      border-radius: 9px; display: flex; align-items: center; justify-content: center;
      padding: 0 4px; border: 2px solid #fff;
    }
    .dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      width: 360px; max-height: 420px; background: #fff;
      border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.15);
      z-index: 1000; overflow: hidden;
      animation: slideDown 0.2s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .dropdown-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid #f1f5f9;
    }
    .dropdown-header h3 { margin: 0; font-size: 14px; font-weight: 600; color: #1e293b; }
    .mark-all {
      background: none; border: none; color: #1e40af; font-size: 12px;
      cursor: pointer; font-weight: 500;
    }
    .mark-all:hover { text-decoration: underline; }
    .dropdown-list { max-height: 360px; overflow-y: auto; }
    .notif-item {
      display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px;
      cursor: pointer; transition: background 0.15s; border-bottom: 1px solid #f8fafc;
    }
    .notif-item:hover { background: #f8fafc; }
    .notif-item.unread { background: #eff6ff; }
    .notif-item.unread:hover { background: #dbeafe; }
    .notif-icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .type-deposit { background: #f0fdf4; color: #16a34a; }
    .type-withdrawal { background: #fef2f2; color: #dc2626; }
    .type-transfer_in { background: #eff6ff; color: #1e40af; }
    .type-transfer_out { background: #fff7ed; color: #ea580c; }
    .type-system, .type-security { background: #f8fafc; color: #64748b; }
    .notif-body { flex: 1; min-width: 0; }
    .notif-title { font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 2px; }
    .notif-message { font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-time { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .notif-amount { font-size: 13px; font-weight: 600; white-space: nowrap; margin-top: 2px; }
    .notif-amount.positive { color: #16a34a; }
    .notif-amount.negative { color: #dc2626; }
    .dropdown-empty {
      padding: 32px; text-align: center; color: #94a3b8;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .dropdown-empty p { margin: 0; font-size: 13px; }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  notifications: Notification[] = [];
  open = false;
  private subs: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.notificationService.getUnreadCount().subscribe();
    this.subs.push(
      this.notificationService.unread$.subscribe(count => this.unreadCount = count)
    );
    this.subs.push(
      this.socketService.onNotification().subscribe(() => {
        this.notificationService.incrementUnread();
        if (this.open) this.loadNotifications();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(): void {
    this.open = false;
  }

  toggleDropdown(e: Event): void {
    e.stopPropagation();
    this.open = !this.open;
    if (this.open) this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.getNotifications(1, 20).subscribe({
      next: (res) => this.notifications = res.notifications,
    });
  }

  onNotificationClick(n: Notification): void {
    if (!n.read) {
      this.notificationService.markAsRead(n._id).subscribe();
      n.read = true;
    }
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.read = true);
    });
  }

  getTimeAgo(date: string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Ahora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }
}
