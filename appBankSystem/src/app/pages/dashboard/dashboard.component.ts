import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService, AccountData, MonthlySummary } from '../../services/account.service';
import { TransactionService } from '../../services/transaction.service';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationBellComponent } from '../../components/notification-bell.component';
import { SocketService } from '../../services/socket.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ForexService, CurrencyRate } from '../../services/forex.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, NotificationBellComponent, RouterLink, NgChartsModule],
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
  confirmTransfer = false;

  notification: { message: string; amount: number } | null = null;
  private notifTimer: any = null;

  monthlyData: MonthlySummary[] = [];
  greeting = '';

  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 12 } } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed.y;
            return `${ctx.dataset.label}: $${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true,
        grid: { color: '#e2e8f0' },
        ticks: {
          font: { size: 11 },
          callback: (val: any) => `$${Number(val).toLocaleString('es-MX')}`
        }
      }
    }
  };

  doughnutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 12 } } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed;
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
            return `${ctx.label}: $${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${pct}%)`;
          }
        }
      }
    }
  };

  // Forex
  forexRates: CurrencyRate[] = [];
  forexLoading = false;
  forexBase = 'MXN';
  convertFrom = 'USD';
  convertTo = 'MXN';
  convertAmount = 1;
  convertResult: number | null = null;
  convertRate: number | null = null;
  showForexConverter = false;

  darkMode = false;

  constructor(
    private auth: AuthService,
    private accountSvc: AccountService,
    private txnSvc: TransactionService,
    private router: Router,
    private socket: SocketService,
    private forexSvc: ForexService,
  ) {}

  ngOnInit() {
    this.darkMode = localStorage.getItem('vb_darkMode') === 'true';
    this.setGreeting();
    this.auth.ready$.subscribe((ready) => {
      if (!ready) return;
      const u = (this.auth as any).userSubject.value;
      this.user = u;
      if (u) {
        this.loadData();
        this.loadForexRates();
      } else {
        this.router.navigate(['/login']);
      }
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

  setGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Buenos días';
    else if (hour < 19) this.greeting = 'Buenas tardes';
    else this.greeting = 'Buenas noches';
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
    this.loadMonthlySummary(acc.number);
  }

  private loadMonthlySummary(accountNumber: string) {
    this.accountSvc.getMonthlySummary(accountNumber, 6).subscribe({
      next: (res) => {
        this.monthlyData = res.summary;
        this.buildCharts(res.summary);
      },
      error: () => {
        this.monthlyData = [];
      },
    });
  }

  private buildCharts(data: MonthlySummary[]) {
    const labels = data.map(d => {
      const [y, m] = d.month.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1);
      return date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
    });

    this.barChartData = {
      labels,
      datasets: [
        {
          label: 'Depósitos',
          data: data.map(d => d.deposits),
          backgroundColor: '#22c55e',
          borderRadius: 4,
        },
        {
          label: 'Retiros',
          data: data.map(d => d.withdrawals),
          backgroundColor: '#ef4444',
          borderRadius: 4,
        },
        {
          label: 'Transferencias recibidas',
          data: data.map(d => d.transferIn),
          backgroundColor: '#3b82f6',
          borderRadius: 4,
        },
        {
          label: 'Transferencias enviadas',
          data: data.map(d => d.transferOut),
          backgroundColor: '#f59e0b',
          borderRadius: 4,
        }
      ]
    };

    const totals = data.reduce(
      (acc, d) => ({
        deposits: acc.deposits + d.deposits,
        withdrawals: acc.withdrawals + d.withdrawals,
        transferIn: acc.transferIn + d.transferIn,
        transferOut: acc.transferOut + d.transferOut,
      }),
      { deposits: 0, withdrawals: 0, transferIn: 0, transferOut: 0 }
    );

    const hasData = totals.deposits + totals.withdrawals + totals.transferIn + totals.transferOut > 0;

    this.doughnutChartData = {
      labels: ['Depósitos', 'Retiros', 'Transferencias recibidas', 'Transferencias enviadas'],
      datasets: [{
        data: hasData ? [totals.deposits, totals.withdrawals, totals.transferIn, totals.transferOut] : [1, 1, 1, 1],
        backgroundColor: hasData ? ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b'] : ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b'],
        borderWidth: 0,
      }]
    };
  }

  // Forex
  loadForexRates() {
    this.forexLoading = true;
    this.forexSvc.getRates(this.forexBase).subscribe({
      next: (res) => {
        this.forexRates = res.rates.slice(0, 5);
        this.forexLoading = false;
      },
      error: () => {
        this.forexLoading = false;
      },
    });
  }

  doConvert() {
    if (!this.convertAmount || this.convertAmount <= 0) return;
    this.forexSvc.convert(this.convertFrom, this.convertTo, this.convertAmount).subscribe({
      next: (res) => {
        this.convertResult = res.result;
        this.convertRate = res.rate;
      },
      error: () => {
        this.convertResult = null;
        this.convertRate = null;
      },
    });
  }

  swapCurrencies() {
    const temp = this.convertFrom;
    this.convertFrom = this.convertTo;
    this.convertTo = temp;
    if (this.convertResult !== null) {
      this.convertAmount = this.convertResult;
      this.convertResult = null;
      this.doConvert();
    }
  }

  getChangeClass(change: number): string {
    return change > 0 ? 'positive' : change < 0 ? 'negative' : '';
  }

  get totalBalance(): number {
    return this.accounts.reduce((sum, a) => sum + (a.isActive ? a.balance : 0), 0);
  }

  get activeAccounts(): number {
    return this.accounts.filter(a => a.isActive).length;
  }

  get recentTransactionsCount(): number {
    return this.transactions.length;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('vb_darkMode', String(this.darkMode));
    this.updateChartColors();
  }

  private updateChartColors() {
    const grid = this.darkMode ? '#334155' : '#e2e8f0';
    const tick = this.darkMode ? '#94a3b8' : '#475569';
    const legendColor = this.darkMode ? '#cbd5e1' : '#475569';
    this.barChartOptions = {
      ...this.barChartOptions,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 12 }, color: legendColor } },
        tooltip: this.barChartOptions?.plugins?.tooltip
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: tick } },
        y: {
          beginAtZero: true,
          grid: { color: grid },
          ticks: {
            font: { size: 11 },
            color: tick,
            callback: (val: any) => `$${Number(val).toLocaleString('es-MX')}`
          }
        }
      }
    };
    this.doughnutChartOptions = {
      ...this.doughnutChartOptions,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 12 }, color: legendColor } },
        tooltip: this.doughnutChartOptions?.plugins?.tooltip
      }
    };
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

  accountTypeIcon(type: string): string {
    return type === 'savings' ? 'AH' : 'CO';
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
    this.confirmTransfer = false;
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

    if (!this.confirmTransfer) {
      this.confirmTransfer = true;
      return;
    }

    this.txnError = '';
    this.txnSuccess = '';
    this.txnSvc.transfer(this.selectedAccount.number, this.transferTo, this.transferAmount).subscribe({
      next: (res) => {
        this.txnSuccess = `Transferencia de ${this.formatCurrency(this.transferAmount)} exitosa`;
        this.confirmTransfer = false;
        this.refreshAccount(res.source.number);
        setTimeout(() => this.closeModal('transfer'), 1200);
      },
      error: (err) => {
        this.txnError = err.error?.error || 'Error al transferir';
        this.confirmTransfer = false;
      },
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
