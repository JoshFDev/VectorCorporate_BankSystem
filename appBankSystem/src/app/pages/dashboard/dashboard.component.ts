import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService, AccountData } from '../../services/account.service';
import { TransactionService, TransactionData } from '../../services/transaction.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  user: any = null;
  accounts: AccountData[] = [];
  selectedAccount: AccountData | null = null;
  transactions: TransactionData[] = [];
  loading = true;
  error = '';

  constructor(
    private auth: AuthService,
    private accountSvc: AccountService,
    private txnSvc: TransactionService,
    private router: Router
  ) {}

  ngOnInit() {
    this.auth.user$.subscribe((u) => {
      this.user = u;
      if (u) this.loadData();
      else this.router.navigate(['/login']);
    });
  }

  private loadData() {
    this.loading = true;
    this.accountSvc.getMyAccounts().subscribe({
      next: (res) => {
        this.accounts = res.accounts;
        if (res.accounts.length > 0) {
          this.selectAccount(res.accounts[0]);
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar datos';
        this.loading = false;
      },
    });
  }

  selectAccount(acc: AccountData) {
    this.selectedAccount = acc;
    this.accountSvc.getTransactions(acc.number, 1, 5).subscribe({
      next: (res) => (this.transactions = res.transactions || []),
      error: () => (this.transactions = []),
    });
  }

  get totalBalance(): number {
    return this.accounts.reduce((sum, a) => sum + (a.isActive ? a.balance : 0), 0);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  txnIcon(type: string): string {
    const icons: Record<string, string> = {
      deposit: '⬇',
      withdrawal: '⬆',
      transfer_in: '↘',
      transfer_out: '↗',
    };
    return icons[type] || '•';
  }

  txnLabel(type: string): string {
    const labels: Record<string, string> = {
      deposit: 'Depósito',
      withdrawal: 'Retiro',
      transfer_in: 'Transferencia recibida',
      transfer_out: 'Transferencia enviada',
    };
    return labels[type] || type;
  }

  txnClass(type: string): string {
    const cls: Record<string, string> = {
      deposit: 'deposit',
      withdrawal: 'withdrawal',
      transfer_in: 'transfer-in',
      transfer_out: 'transfer-out',
    };
    return cls[type] || '';
  }

  accountTypeLabel(type: string): string {
    return type === 'savings' ? 'Ahorros' : 'Corriente';
  }

  logout() {
    this.auth.logout();
  }
}
