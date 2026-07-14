import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService, AccountData } from '../../services/account.service';
import { NotificationBellComponent } from '../../components/notification-bell.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NotificationBellComponent],
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

  filterType = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterMinAmount: number | null = null;
  filterMaxAmount: number | null = null;
  filterDescription = '';
  filterSort = 'createdAt';
  filterOrder = 'desc';

  availableLimits = [5, 10, 20, 50];
  searchTimeout: any = null;
  showAdvanced = false;

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
    this.clearFilters();
    this.loadTransactions();
  }

  clearFilters() {
    this.filterType = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterMinAmount = null;
    this.filterMaxAmount = null;
    this.filterDescription = '';
    this.filterSort = 'createdAt';
    this.filterOrder = 'desc';
  }

  applyFilters() {
    this.page = 1;
    this.loadTransactions();
  }

  onDescriptionSearch() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.loadTransactions();
    }, 400);
  }

  changeLimit(limit: number) {
    this.limit = limit;
    this.page = 1;
    this.loadTransactions();
  }

  loadTransactions() {
    if (!this.selectedAccount) return;
    this.loading = true;

    this.accountSvc.searchTransactions(this.selectedAccount.number, {
      type: this.filterType || undefined,
      from: this.filterDateFrom || undefined,
      to: this.filterDateTo || undefined,
      minAmount: this.filterMinAmount ?? undefined,
      maxAmount: this.filterMaxAmount ?? undefined,
      description: this.filterDescription || undefined,
      sort: this.filterSort,
      order: this.filterOrder,
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: (res) => {
        this.transactions = res.transactions || [];
        this.total = res.pagination?.total || 0;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  get pages(): number[] {
    const p = this.totalPages;
    const start = Math.max(1, this.page - 5);
    const end = Math.min(p, start + 9);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadTransactions();
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterType || this.filterDateFrom || this.filterDateTo ||
      this.filterMinAmount || this.filterMaxAmount || this.filterDescription);
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

  exportStatement(format: 'csv' | 'pdf') {
    if (!this.selectedAccount) return;
    let url = `${environment.apiUrl}/accounts/${this.selectedAccount.number}/export?format=${format}`;
    if (this.filterDateFrom) url += `&from=${this.filterDateFrom}`;
    if (this.filterDateTo) url += `&to=${this.filterDateTo}`;
    window.open(url, '_blank');
  }

  downloadReceipt(txId: string) {
    const url = `${environment.apiUrl}/accounts/transaction/${txId}/receipt`;
    window.open(url, '_blank');
  }
}
