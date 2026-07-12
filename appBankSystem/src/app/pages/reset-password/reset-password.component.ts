import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  template: `
    <div class="wrapper">
      <div class="card">
        <div class="card-header">
          <div class="brand">
            <div class="brand-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h1>VectorBank</h1>
          </div>
          <p class="subtitle">Nueva contraseña</p>
        </div>

        <div *ngIf="!success">
          <form [formGroup]="passForm" (ngSubmit)="onSubmit()">
            <div class="field">
              <div class="input-wrap" [class.focused]="focusedField === 'pass'" [class.has-value]="passForm.get('password')?.value">
                <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input formControlName="password" type="password" placeholder=" " (focus)="focusedField = 'pass'" (blur)="focusedField = ''" />
                <label>Nueva contraseña</label>
              </div>
            </div>
            <div class="field">
              <div class="input-wrap" [class.focused]="focusedField === 'confirm'" [class.has-value]="passForm.get('confirm')?.value" [class.error]="passForm.hasError('mismatch') && passForm.get('confirm')?.touched">
                <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input formControlName="confirm" type="password" placeholder=" " (focus)="focusedField = 'confirm'" (blur)="focusedField = ''" />
                <label>Confirmar contraseña</label>
              </div>
            </div>

            <p *ngIf="error" class="alert alert-error">{{ error }}</p>
            <button type="submit" class="btn-submit" [disabled]="passForm.invalid || sending">
              {{ sending ? 'Guardando...' : 'Restablecer contraseña' }}
            </button>
          </form>
        </div>

        <div *ngIf="success" class="success-box">
          <p>Contraseña actualizada exitosamente.</p>
          <a routerLink="/login" class="btn-submit" style="display: block; text-align: center; text-decoration: none; margin-top: 16px;">Iniciar sesión</a>
        </div>

        <p class="back-link"><a routerLink="/login">Volver al inicio de sesión</a></p>
      </div>
    </div>
  `,
  styles: [`
    .wrapper { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0a1628; padding: 1rem; }
    .card { background: #fff; border-radius: 16px; width: 100%; max-width: 400px; padding: 2.5rem; box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
    .card-header { text-align: center; margin-bottom: 2rem; }
    .brand { display: flex; align-items: center; justify-content: center; gap: 10px; }
    .brand-icon { width: 38px; height: 38px; border-radius: 10px; background: #1e40af; color: #fff; display: flex; align-items: center; justify-content: center; }
    .brand h1 { font-size: 24px; font-weight: 600; color: #1e293b; margin: 0; }
    .subtitle { color: #64748b; font-size: 14px; margin: 4px 0 0; }
    .field { margin-bottom: 16px; }
    .input-wrap { position: relative; display: flex; align-items: center; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 12px; background: #fff; transition: border-color 0.2s; }
    .input-wrap:hover { border-color: #cbd5e1; }
    .input-wrap.focused { border-color: #1e40af; }
    .input-wrap.error { border-color: #dc2626; }
    .icon { flex-shrink: 0; color: #94a3b8; margin-right: 10px; }
    .input-wrap.focused .icon { color: #1e40af; }
    .input-wrap input { flex: 1; border: none; outline: none; background: transparent; font-size: 14px; padding: 13px 0; color: #1e293b; width: 100%; font-family: inherit; }
    .input-wrap label { position: absolute; left: 40px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 14px; pointer-events: none; transition: all 0.2s; padding: 0 4px; background: #fff; }
    .input-wrap.focused label, .input-wrap.has-value label { top: 0; transform: translateY(-50%) scale(0.82); color: #64748b; }
    .input-wrap.focused label { color: #1e40af; }
    .btn-submit { width: 100%; padding: 14px; background: #1e40af; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-submit:hover:not(:disabled) { background: #1e3a8a; }
    .btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }
    .alert { text-align: center; padding: 10px 16px; border-radius: 8px; font-size: 14px; margin-top: 16px; }
    .alert-error { background: #fef2f2; color: #dc2626; }
    .back-link { text-align: center; margin-top: 24px; font-size: 14px; }
    .back-link a { color: #1e40af; text-decoration: none; font-weight: 600; }
    .back-link a:hover { text-decoration: underline; }
    .success-box { text-align: center; padding: 20px 0; }
    .success-box p { color: #1e293b; font-size: 15px; margin: 0 0 8px; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  passForm;
  focusedField = '';
  error = '';
  sending = false;
  success = false;
  token = '';
  private api = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.passForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', Validators.required]
    }, { validators: (g) => g.value.password === g.value.confirm ? null : { mismatch: true } });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.error = 'Token inválido';
    }
  }

  onSubmit() {
    if (this.passForm.invalid || !this.token) return;
    this.error = '';
    this.sending = true;
    this.http.post(`${this.api}/auth/reset-password`, {
      token: this.token,
      newPassword: this.passForm.value.password
    }).subscribe({
      next: () => { this.success = true; this.sending = false; },
      error: (err) => { this.error = err.error?.error || 'Error al restablecer contraseña'; this.sending = false; }
    });
  }
}
