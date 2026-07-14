import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toasts.asObservable();
  private counter = 0;

  show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = ++this.counter;
    const toast: Toast = { id, message, type };
    this.toasts.next([...this.toasts.value, toast]);

    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 6000);
  }

  warning(message: string): void {
    this.show(message, 'warning', 5000);
  }

  dismiss(id: number): void {
    this.toasts.next(this.toasts.value.filter(t => t.id !== id));
  }
}
