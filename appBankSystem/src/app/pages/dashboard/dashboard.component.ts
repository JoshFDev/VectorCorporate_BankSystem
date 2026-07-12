import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService, AccountData } from '../../services/account.service';
import { TransactionService } from '../../services/transaction.service';
import { ModalComponent } from '../../components/modal/modal.component';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  accounts: AccountData[] = [];
  selectedAccount: AccountData | null = null;
  transactions: any[] = [];
  loading = true;
  error = '';

  showDeposit = false;
  showWithdraw = false;
  showTransfer = false;
  showCreateAccount = false;
  txnError = '';
  txnSuccess = '';
  newAccountType: 'savings' | 'checking' = 'savings';
  saving = false;

  depositAmount = 0;
  withdrawAmount = 0;
  transferAmount = 0;
  transferTo = '';

  notification: { message: string; amount: number } | null = null;
  private notifTimer: any = null;

  constructor(
    private auth: AuthService,
    private accountSvc: AccountService,
    private txnSvc: TransactionService,
    private router: Router,
    private socket: SocketService,
  ) {}

  ngOnInit() {
    this.auth.ready$.subscribe((ready) => {
      if (!ready) return;
      const u = (this.auth as any).userSubject.value;
      this.user = u;
      if (u) this.loadData();
      else this.router.navigate(['/login']);
    });

    this.socket.transferReceived$.subscribe((data) => {
      this.notification = {
        message: `Transferencia de ${this.formatCurrency(data.amount)} de cuenta ${data.fromAccount}`,
        amount: data.amount
      };
      if (this.notifTimer) clearTimeout(this.notifTimer);
      this.notifTimer = setTimeout(() => this.notification = null, 6000);
      if (this.selectedAccount) this.selectAccount(this.selectedAccount);
    });
  }

  ngOnDestroy() {
    if (this.notifTimer) clearTimeout(this.notifTimer);
  }

  private loadData() {
    this.loading = true;
    this.accountSvc.getMyAccounts().subscribe({
      next: (res) => {
        this.accounts = res.accounts;
        if (res.accounts.length > 0) this.selectAccount(res.accounts[0]);
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
    const icons: Record<string, string> = { deposit: '⬇', withdrawal: '⬆', transfer_in: '↘', transfer_out: '↗' };
    return icons[type] || '•';
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

  openModal(type: 'deposit' | 'withdraw' | 'transfer' | 'createAccount') {
    this.txnError = '';
    this.txnSuccess = '';
    this.depositAmount = 0;
    this.withdrawAmount = 0;
    this.transferAmount = 0;
    this.transferTo = '';
    this.newAccountType = 'savings';
    if (type === 'deposit') this.showDeposit = true;
    if (type === 'withdraw') this.showWithdraw = true;
    if (type === 'transfer') this.showTransfer = true;
    if (type === 'createAccount') this.showCreateAccount = true;
  }

  closeModal(type: 'deposit' | 'withdraw' | 'transfer' | 'createAccount') {
    if (type === 'deposit') this.showDeposit = false;
    if (type === 'withdraw') this.showWithdraw = false;
    if (type === 'transfer') this.showTransfer = false;
    if (type === 'createAccount') this.showCreateAccount = false;
  }

  doDeposit() {
    if (!this.selectedAccount || this.depositAmount <= 0) return;
    this.txnError = '';
    this.txnSuccess = '';
    this.txnSvc.deposit(this.selectedAccount.number, this.depositAmount).subscribe({
      next: (res) => {
        this.txnSuccess = `Depósito de ${this.formatCurrency(this.depositAmount)} exitoso`;
        this.refreshAccount(res.account.number);
        setTimeout(() => this.closeModal('deposit'), 1200);
      },
      error: (err) => (this.txnError = err.error?.error || 'Error al depositar'),
    });
  }

  doWithdraw() {
    if (!this.selectedAccount || this.withdrawAmount <= 0) return;
    this.txnError = '';
    this.txnSuccess = '';
    this.txnSvc.withdraw(this.selectedAccount.number, this.withdrawAmount).subscribe({
      next: (res) => {
        this.txnSuccess = `Retiro de ${this.formatCurrency(this.withdrawAmount)} exitoso`;
        this.refreshAccount(res.account.number);
        setTimeout(() => this.closeModal('withdraw'), 1200);
      },
      error: (err) => (this.txnError = err.error?.error || 'Error al retirar'),
    });
  }

  doTransfer() {
    if (!this.selectedAccount || this.transferAmount <= 0 || !this.transferTo) return;
    this.txnError = '';
    this.txnSuccess = '';
    this.txnSvc.transfer(this.selectedAccount.number, this.transferTo, this.transferAmount).subscribe({
      next: (res) => {
        this.txnSuccess = `Transferencia de ${this.formatCurrency(this.transferAmount)} exitosa`;
        this.refreshAccount(res.source.number);
        setTimeout(() => this.closeModal('transfer'), 1200);
      },
      error: (err) => (this.txnError = err.error?.error || 'Error al transferir'),
    });
  }

  doCreateAccount() {
    this.txnError = '';
    this.txnSuccess = '';
    this.saving = true;
    this.accountSvc.createAccount(this.newAccountType).subscribe({
      next: (res) => {
        this.txnSuccess = `Cuenta ${res.account.number} creada`;
        this.saving = false;
        this.loadData();
        setTimeout(() => this.closeModal('createAccount'), 1200);
      },
      error: (err) => {
        this.txnError = err.error?.error || 'Error al crear cuenta';
        this.saving = false;
      },
    });
  }

  private refreshAccount(accountNumber: string) {
    this.accountSvc.getAccount(accountNumber).subscribe((res) => {
      const idx = this.accounts.findIndex((a) => a.number === accountNumber);
      if (idx !== -1) {
        this.accounts[idx].balance = res.account.balance;
        this.selectedAccount = this.accounts[idx];
      }
      this.loadData();
    });
  }
}
