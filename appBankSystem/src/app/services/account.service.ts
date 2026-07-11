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
}
