import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService, AccountData } from '../../services/account.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements OnInit {
  accounts: AccountData[] = [];
  selectedAccount: AccountData | null = null;
  transactions: any[] = [];
  loading = true;

  page = 1;
  limit = 10;
  total = 0;

  constructor(
    private auth: AuthService,
    private accountSvc: AccountService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.auth.ready$.subscribe((ready) => {
      if (!ready) return;
      const u = (this.auth as any).userSubject.value;
      if (!u) this.router.navigate(['/login']);
    });
    this.loadAccounts();
  }

  private loadAccounts() {
    this.accountSvc.getMyAccounts().subscribe({
      next: (res) => {
        this.accounts = res.accounts;
        if (res.accounts.length > 0) this.selectAccount(res.accounts[0]);
        else this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  selectAccount(acc: AccountData) {
    this.selectedAccount = acc;
    this.page = 1;
    this.loadTransactions();
  }

  loadTransactions() {
    if (!this.selectedAccount) return;
    this.loading = true;
    this.accountSvc.getTransactions(this.selectedAccount.number, this.page, this.limit).subscribe({
      next: (res) => {
        this.transactions = res.transactions || [];
        this.total = res.pagination?.total || 0;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  get pages(): number[] {
    const totalPages = Math.ceil(this.total / this.limit);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  goPage(p: number) {
    this.page = p;
    this.loadTransactions();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  txnLabel(type: string): string {
    const labels: Record<string, string> = { deposit: 'Depósito', withdrawal: 'Retiro', transfer_in: 'Transferencia recibida', transfer_out: 'Transferencia enviada' };
    return labels[type] || type;
  }

  txnClass(type: string): string {
    const cls: Record<string, string> = { deposit: 'deposit', withdrawal: 'withdrawal', transfer_in: 'transfer-in', transfer_out: 'transfer-out' };
    return cls[type] || '';
  }

  accountTypeLabel(type: string): string {
    return type === 'savings' ? 'Ahorros' : 'Corriente';
  }

  logout() {
    this.auth.logout();
  }
}
