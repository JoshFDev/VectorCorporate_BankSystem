import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface RecurringPayment {
  _id: string;
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  description: string;
  category: string;
  frequency: string;
  nextExecuteAt: string;
  lastExecuteAt: string | null;
  isActive: boolean;
  executionCount: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class RecurringService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPayments(): Observable<{ payments: RecurringPayment[] }> {
    return this.http.get<{ payments: RecurringPayment[] }>(`${this.api}/recurring`);
  }

  createPayment(data: {
    fromAccountNumber: string;
    toAccountNumber: string;
    amount: number;
    description?: string;
    category?: string;
    frequency: string;
  }): Observable<any> {
    return this.http.post(`${this.api}/recurring`, data);
  }

  updatePayment(id: string, data: Partial<RecurringPayment>): Observable<any> {
    return this.http.put(`${this.api}/recurring/${id}`, data);
  }

  deletePayment(id: string): Observable<any> {
    return this.http.delete(`${this.api}/recurring/${id}`);
  }
}
