import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FingerprintService } from '../../services/fingerprint.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="card-header">
          <div class="brand">
            <div class="brand-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 9v4"/><path d="M12 17h.01"/>
              </svg>
            </div>
            <h1>VectorBank</h1>
          </div>
          <p class="subtitle">Sistema Bancario</p>
        </div>

        <div class="mode-toggle">
          <button type="button" [class.active]="mode === 'password'" (click)="mode = 'password'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Contraseña
          </button>
          <button type="button" [class.active]="mode === 'fingerprint'" (click)="mode = 'fingerprint'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/></svg>
            Huella
          </button>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="field">
            <div class="input-wrap" [class.focused]="focusedField === 'email'" [class.has-value]="loginForm.get('email')?.value" [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <input formControlName="email" type="email" placeholder=" " (focus)="focusedField = 'email'" (blur)="focusedField = ''" autocomplete="email" />
              <label>Correo electrónico</label>
            </div>
          </div>

          <ng-container *ngIf="mode === 'password'">
            <div class="field">
              <div class="input-wrap" [class.focused]="focusedField === 'password'" [class.has-value]="loginForm.get('password')?.value" [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input formControlName="password" type="password" placeholder=" " (focus)="focusedField = 'password'" (blur)="focusedField = ''" autocomplete="current-password" />
                <label>Contraseña</label>
              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="mode === 'fingerprint'">
            <div class="fingerprint-area" (click)="scanFingerprint()" [class.scanning]="scanning" [class.error]="fingerprintError">
              <div class="fingerprint-icon">
                <svg *ngIf="!scanning && !fingerprintError" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                  <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                  <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                  <path d="M2 12a10 10 0 0 1 18-6"/>
                  <path d="M2 16h.01"/>
                  <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                  <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/>
                  <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                  <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                </svg>
                <div *ngIf="scanning" class="spinner-ring"></div>
                <svg *ngIf="fingerprintError && !scanning" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <p class="fingerprint-label">{{ scanning ? 'Escaneando...' : fingerprintError ? 'Huella no detectada. Toca para reintentar' : 'Toca para escanear tu huella' }}</p>
            </div>
          </ng-container>

          <button type="submit" class="btn-submit" [disabled]="loginForm.invalid || scanning">
            {{ mode === 'password' ? 'Iniciar sesión' : 'Iniciar sesión con huella' }}
          </button>

          <p *ngIf="error" class="alert alert-error">{{ error }}</p>

          <p class="forgot-link" *ngIf="mode === 'password'"><a routerLink="/forgot-password">¿Olvidaste tu contraseña?</a></p>
        </form>

        <p class="register-link">¿No tienes cuenta? <a routerLink="/register">Regístrate aquí</a></p>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex; justify-content: center; align-items: center;
      min-height: 100vh; background: #0a1628; padding: 1rem;
    }
    .login-card {
      background: #fff; border-radius: 16px; width: 100%; max-width: 400px;
      padding: 2.5rem; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .card-header { text-align: center; margin-bottom: 1.5rem; }
    .brand { display: flex; align-items: center; justify-content: center; gap: 10px; }
    .brand-icon {
      width: 38px; height: 38px; border-radius: 10px;
      background: #1e40af; color: #fff;
      display: flex; align-items: center; justify-content: center;
    }
    .brand h1 { font-size: 24px; font-weight: 600; color: #1e293b; margin: 0; }
    .subtitle { color: #64748b; font-size: 14px; margin: 4px 0 0; }
    .mode-toggle {
      display: flex; gap: 8px; margin-bottom: 20px;
      background: #f1f5f9; border-radius: 10px; padding: 4px;
    }
    .mode-toggle button {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px; border: none; border-radius: 8px; cursor: pointer;
      font-size: 13px; font-weight: 500; background: transparent; color: #64748b;
      transition: all 0.2s;
    }
    .mode-toggle button.active {
      background: #fff; color: #1e40af; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .field { margin-bottom: 16px; }
    .input-wrap {
      position: relative; display: flex; align-items: center;
      border: 1.5px solid #e2e8f0; border-radius: 8px;
      padding: 0 12px; background: #fff; transition: border-color 0.2s;
    }
    .input-wrap:hover { border-color: #cbd5e1; }
    .input-wrap.focused { border-color: #1e40af; }
    .input-wrap.error { border-color: #dc2626; }
    .icon { flex-shrink: 0; color: #94a3b8; margin-right: 10px; }
    .input-wrap.focused .icon { color: #1e40af; }
    .input-wrap.error .icon { color: #dc2626; }
    .input-wrap input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 14px; padding: 13px 0; color: #1e293b; width: 100%; font-family: inherit;
    }
    .input-wrap label {
      position: absolute; left: 40px; top: 50%; transform: translateY(-50%);
      color: #94a3b8; font-size: 14px; pointer-events: none; transition: all 0.2s;
      padding: 0 4px; background: #fff;
    }
    .input-wrap.focused label, .input-wrap.has-value label {
      top: 0; transform: translateY(-50%) scale(0.82); color: #64748b;
    }
    .input-wrap.focused label { color: #1e40af; }
    .fingerprint-area {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 32px; margin-bottom: 16px; border: 2px dashed #e2e8f0;
      border-radius: 12px; cursor: pointer; transition: all 0.3s;
    }
    .fingerprint-area:hover { border-color: #1e40af; background: #eff6ff; }
    .fingerprint-area.scanning { border-color: #1e40af; background: #eff6ff; animation: pulse 1.5s infinite; }
    .fingerprint-area.error { border-color: #dc2626; background: #fef2f2; }
    .fingerprint-icon { margin-bottom: 12px; color: #1e40af; }
    .fingerprint-label { color: #64748b; font-size: 13px; text-align: center; margin: 0; }
    .spinner-ring {
      width: 48px; height: 48px; border: 3px solid #e2e8f0;
      border-top-color: #1e40af; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(30,64,175,0.2); }
      50% { box-shadow: 0 0 0 12px rgba(30,64,175,0); }
    }
    .btn-submit {
      width: 100%; padding: 14px; background: #1e40af; color: #fff;
      border: none; border-radius: 8px; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background 0.2s;
    }
    .btn-submit:hover:not(:disabled) { background: #1e3a8a; }
    .btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }
    .alert { text-align: center; padding: 10px 16px; border-radius: 8px; font-size: 14px; margin-top: 16px; }
    .alert-error { background: #fef2f2; color: #dc2626; }
    .forgot-link { text-align: center; margin-top: 12px; font-size: 13px; }
    .forgot-link a { color: #64748b; text-decoration: none; }
    .forgot-link a:hover { color: #1e40af; text-decoration: underline; }
    .register-link { text-align: center; margin-top: 24px; color: #64748b; font-size: 14px; }
    .register-link a { color: #1e40af; text-decoration: none; font-weight: 600; }
    .register-link a:hover { text-decoration: underline; }
  `]
})
export class LoginComponent {
  loginForm;
  focusedField = '';
  error = '';
  mode: 'password' | 'fingerprint' = 'password';
  scanning = false;
  fingerprintError = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private fp: FingerprintService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  scanFingerprint() {
    const email = this.loginForm.get('email')?.value;
    if (!email || this.loginForm.get('email')?.invalid) {
      this.error = 'Ingresa tu correo primero';
      return;
    }

    this.scanning = true;
    this.fingerprintError = false;
    this.error = '';

    this.fp.identify().subscribe({
      next: (res) => {
        if (!res.found) {
          this.scanning = false;
          this.fingerprintError = true;
          this.error = res.error || 'Huella no encontrada en el sensor';
          return;
        }
        this.auth.loginWithFingerprint(email, res.position!).subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: (err) => {
            this.scanning = false;
            this.fingerprintError = true;
            this.error = err.error?.error || 'Huella no reconocida en tu cuenta';
          }
        });
      },
      error: (err) => {
        this.scanning = false;
        this.fingerprintError = true;
        this.error = err.error?.error || 'Error al comunicarse con el sensor';
      },
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.error = '';
    const { email, password } = this.loginForm.value;
    this.auth.login(email!, password!)
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => this.error = err.error?.error || 'Error al iniciar sesión'
      });
  }
}
