import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-forgot-password',
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
          <p class="subtitle">Recuperar contraseña</p>
        </div>

        <div *ngIf="!sent">
          <form [formGroup]="emailForm" (ngSubmit)="onSubmit()">
            <div class="field">
              <div class="input-wrap" [class.focused]="focusedField === 'email'" [class.has-value]="emailForm.get('email')?.value" [class.error]="emailForm.get('email')?.invalid && emailForm.get('email')?.touched">
                <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <input formControlName="email" type="email" placeholder=" " (focus)="focusedField = 'email'" (blur)="focusedField = ''" autocomplete="email" />
                <label>Correo electrónico</label>
              </div>
            </div>

            <p *ngIf="error" class="alert alert-error">{{ error }}</p>
            <button type="submit" class="btn-submit" [disabled]="emailForm.invalid || sending">
              {{ sending ? 'Enviando...' : 'Enviar enlace' }}
            </button>
          </form>
        </div>

        <div *ngIf="sent" class="success-box">
          <div class="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <p>Si el correo existe, recibirás un enlace de recuperación.</p>
          <p class="sub">Revisa tu bandeja de entrada y spam.</p>
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
    .input-wrap.error .icon { color: #dc2626; }
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
    .success-icon { margin-bottom: 16px; }
    .success-box p { color: #1e293b; font-size: 15px; margin: 0 0 8px; }
    .success-box .sub { color: #64748b; font-size: 13px; }
  `]
})
export class ForgotPasswordComponent {
  emailForm;
  focusedField = '';
  error = '';
  sending = false;
  sent = false;
  private api = environment.apiUrl;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.emailForm.invalid) return;
    this.error = '';
    this.sending = true;
    this.http.post(`${this.api}/auth/forgot-password`, { email: this.emailForm.value.email })
      .subscribe({
        next: () => { this.sent = true; this.sending = false; },
        error: (err) => { this.error = err.error?.error || 'Error al enviar correo'; this.sending = false; }
      });
  }
}
