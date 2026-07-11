import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { ModalComponent } from '../../components/modal/modal.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  user: any = null;
  loading = true;
  error = '';
  activeTab: 'users' | 'audit' | 'accounts' = 'users';

  // Stats
  stats: any = null;

  // Users
  users: any[] = [];
  usersPage = 1;
  usersTotal = 0;
  usersPages = 0;
  usersSearch = '';
  usersRole = '';
  usersSaving = false;

  // Accounts
  accounts: any[] = [];
  accountsPage = 1;
  accountsTotal = 0;
  accountsPages = 0;
  accountsType = '';
  accountsStatus = '';

  // Audit
  logs: any[] = [];
  logsPage = 1;
  logsTotal = 0;
  logsPages = 0;
  logsAction = '';
  logsSearch = '';

  // User detail modal
  showUserDetail = false;
  selectedUser: any = null;
  selectedUserAccounts: any[] = [];

  // Role change
  showRoleModal = false;
  roleTarget: any = null;
  newRole = 'client';

  constructor(
    private auth: AuthService,
    private admin: AdminService,
  ) {}

  ngOnInit() {
    this.auth.ready$.subscribe((ready) => {
      if (!ready) return;
      const u = (this.auth as any).userSubject.value;
      this.user = u;
      if (!u || !['admin', 'supervisor', 'teller'].includes(u.role)) {
        this.error = 'Acceso denegado';
        this.loading = false;
        return;
      }
      this.loadStats();
      this.loadUsers();
    });
  }

  loadStats() {
    this.admin.getStats().subscribe({
      next: (res) => { this.stats = res; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  // ---- Users ----
  loadUsers() {
    this.admin.getUsers(this.usersPage, 20, this.usersSearch, this.usersRole).subscribe({
      next: (res) => {
        this.users = res.users;
        this.usersTotal = res.pagination.total;
        this.usersPages = res.pagination.pages;
      },
      error: (err) => { this.error = err.error?.error || 'Error al cargar usuarios'; },
    });
  }

  searchUsers() {
    this.usersPage = 1;
    this.loadUsers();
  }

  goUsersPage(p: number) {
    this.usersPage = p;
    this.loadUsers();
  }

  openUserDetail(id: string) {
    this.admin.getUser(id).subscribe({
      next: (res) => {
        this.selectedUser = res.user;
        this.selectedUserAccounts = res.accounts;
        this.showUserDetail = true;
      },
      error: (err) => { this.error = err.error?.error || 'Error al cargar usuario'; },
    });
  }

  doVerify(id: string) {
    this.admin.verifyUser(id).subscribe({
      next: () => { this.loadUsers(); if (this.selectedUser?._id === id) this.selectedUser.isVerified = true; },
      error: (err) => { this.error = err.error?.error || 'Error al verificar'; },
    });
  }

  openRoleModal(u: any) {
    this.roleTarget = u;
    this.newRole = u.role;
    this.showRoleModal = true;
  }

  doChangeRole() {
    if (!this.roleTarget) return;
    this.admin.changeRole(this.roleTarget.id || this.roleTarget._id, this.newRole).subscribe({
      next: () => {
        this.showRoleModal = false;
        this.loadUsers();
      },
      error: (err) => { this.error = err.error?.error || 'Error al cambiar rol'; },
    });
  }

  doToggleActive(u: any) {
    const id = u.id || u._id;
    this.admin.toggleActive(id).subscribe({
      next: () => { this.loadUsers(); },
      error: (err) => { this.error = err.error?.error || 'Error al cambiar estado'; },
    });
  }

  // ---- Accounts ----
  loadAccounts() {
    this.admin.getAccounts(this.accountsPage, 20, this.accountsType, this.accountsStatus).subscribe({
      next: (res) => {
        this.accounts = res.accounts;
        this.accountsTotal = res.pagination.total;
        this.accountsPages = res.pagination.pages;
      },
      error: (err) => { this.error = err.error?.error || 'Error al cargar cuentas'; },
    });
  }

  filterAccounts() {
    this.accountsPage = 1;
    this.loadAccounts();
  }

  goAccountsPage(p: number) {
    this.accountsPage = p;
    this.loadAccounts();
  }

  // ---- Audit ----
  loadAuditLogs() {
    this.admin.getAuditLogs(this.logsPage, 20, this.logsAction, this.logsSearch).subscribe({
      next: (res) => {
        this.logs = res.logs;
        this.logsTotal = res.pagination.total;
        this.logsPages = res.pagination.pages;
      },
      error: (err) => { this.error = err.error?.error || 'Error al cargar auditoria'; },
    });
  }

  filterLogs() {
    this.logsPage = 1;
    this.loadAuditLogs();
  }

  goLogsPage(p: number) {
    this.logsPage = p;
    this.loadAuditLogs();
  }

  switchTab(tab: 'users' | 'audit' | 'accounts') {
    this.activeTab = tab;
    this.error = '';
    if (tab === 'users') this.loadUsers();
    else if (tab === 'accounts') this.loadAccounts();
    else if (tab === 'audit') this.loadAuditLogs();
  }

  // ---- Helpers ----
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  roleBadgeClass(role: string): string {
    const map: Record<string, string> = { admin: 'role-admin', supervisor: 'role-supervisor', teller: 'role-teller', client: 'role-client' };
    return map[role] || '';
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = { admin: 'Admin', supervisor: 'Supervisor', teller: 'Cajero', client: 'Cliente' };
    return map[role] || role;
  }

  actionLabel(action: string): string {
    const map: Record<string, string> = {
      register: 'Registro', login: 'Inicio sesión', deposit: 'Depósito',
      withdrawal: 'Retiro', transfer: 'Transferencia', update_profile: 'Actualización',
      delete_account: 'Baja', verify_user: 'Verificación', role_change: 'Cambio rol',
      admin_action: 'Acción admin',
    };
    return map[action] || action;
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  pageNumbers(total: number): number[] {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  logout() {
    this.auth.logout();
  }
}
