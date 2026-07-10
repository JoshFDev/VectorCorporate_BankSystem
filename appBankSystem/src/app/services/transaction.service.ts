import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface TransactionData {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  relatedAccount?: { number?: string } | string;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  deposit(accountNumber: string, amount: number, description?: string): Observable<any> {
    return this.http.post(`${this.api}/transactions/deposit`, { accountNumber, amount, description });
  }

  withdraw(accountNumber: string, amount: number, description?: string): Observable<any> {
    return this.http.post(`${this.api}/transactions/withdraw`, { accountNumber, amount, description });
  }

  transfer(fromAccount: string, toAccount: string, amount: number, description?: string): Observable<any> {
    return this.http.post(`${this.api}/transactions/transfer`, { fromAccount, toAccount, amount, description });
  }
}
