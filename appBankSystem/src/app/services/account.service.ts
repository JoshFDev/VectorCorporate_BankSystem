import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface AccountData {
  number: string;
  type: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt?: string;
}

export interface MonthlySummary {
  month: string;
  deposits: number;
  withdrawals: number;
  transferIn: number;
  transferOut: number;
  net: number;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMyAccounts(): Observable<{ accounts: AccountData[] }> {
    return this.http.get<{ accounts: AccountData[] }>(`${this.api}/users/me/accounts`);
  }

  getTransactions(accountNumber: string, page = 1, limit = 5): Observable<any> {
    return this.http.get(`${this.api}/accounts/${accountNumber}/transactions?page=${page}&limit=${limit}`);
  }

  getAccount(accountNumber: string): Observable<{ account: AccountData }> {
    return this.http.get<{ account: AccountData }>(`${this.api}/accounts/${accountNumber}`);
  }

  createAccount(type: string = 'savings', currency: string = 'MXN'): Observable<any> {
    return this.http.post(`${this.api}/accounts`, { type, currency });
  }

  getMonthlySummary(accountNumber: string, months = 6): Observable<{ summary: MonthlySummary[]; totals: any }> {
    return this.http.get<{ summary: MonthlySummary[]; totals: any }>(`${this.api}/accounts/${accountNumber}/monthly-summary?months=${months}`);
  }

  searchTransactions(accountNumber: string, filters: {
    type?: string;
    from?: string;
    to?: string;
    minAmount?: number;
    maxAmount?: number;
    description?: string;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
  }): Observable<{ transactions: any[]; pagination: any }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') params.set(key, String(val));
    });
    return this.http.get<{ transactions: any[]; pagination: any }>(`${this.api}/accounts/${accountNumber}/transactions/search?${params.toString()}`);
  }

  getTransactionById(id: string): Observable<{ transaction: any }> {
    return this.http.get<{ transaction: any }>(`${this.api}/accounts/transaction/${id}`);
  }

  getSpendingSummary(accountNumber: string, months = 3): Observable<{ categories: SpendingCategory[]; totalSpent: number; months: number }> {
    return this.http.get<{ categories: SpendingCategory[]; totalSpent: number; months: number }>(
      `${this.api}/accounts/${accountNumber}/spending-summary?months=${months}`
    );
  }
}

export interface SpendingCategory {
  category: string;
  label: string;
  total: number;
  percentage: number;
}
