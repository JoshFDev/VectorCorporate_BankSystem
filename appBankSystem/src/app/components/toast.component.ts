import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of (toastService.toasts$ | async)"
           class="toast toast-{{ toast.type }}"
           (click)="toastService.dismiss(toast.id)">
        <svg *ngIf="toast.type === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <svg *ngIf="toast.type === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <svg *ngIf="toast.type === 'warning'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <svg *ngIf="toast.type === 'info'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>{{ toast.message }}</span>
        <button class="toast-close">&times;</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      display: flex; flex-direction: column; gap: 8px;
    }
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-radius: 10px;
      font-size: 14px; font-weight: 500; cursor: pointer;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
      min-width: 280px; max-width: 420px;
    }
    .toast-close {
      margin-left: auto; background: none; border: none;
      font-size: 18px; cursor: pointer; opacity: 0.6; color: inherit;
    }
    .toast-close:hover { opacity: 1; }
    .toast-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .toast-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .toast-warning { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .toast-info { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
