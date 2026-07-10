import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo">
          <h1>VectorBank</h1>
          <p>Sistema Bancario</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="field">
            <input formControlName="email" placeholder="Correo electrónico" type="email" />
          </div>

          <div class="field">
            <input formControlName="password" placeholder="Contraseña" type="password" />
          </div>

          <button type="submit" [disabled]="loginForm.invalid">
            Iniciar Sesión
          </button>

          <p *ngIf="error" class="error">{{ error }}</p>
        </form>

        <p class="register-link">
          ¿No tienes cuenta?
          <a routerLink="/register">Regístrate aquí</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a237e, #0d47a1);
    }
    .login-card {
      background: white;
      padding: 40px;
      border-radius: 12px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo h1 { color: #1a237e; margin: 0; font-size: 28px; }
    .logo p { color: #666; margin: 4px 0 0; }
    .field { margin-bottom: 16px; }
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }
    input:focus { outline: none; border-color: #1a237e; }
    button {
      width: 100%;
      padding: 12px;
      background: #1a237e;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
    }
    button:disabled { background: #999; cursor: not-allowed; }
    .error { color: #d32f2f; text-align: center; margin-top: 12px; }
    .register-link { text-align: center; margin-top: 20px; color: #666; }
    .register-link a { color: #1a237e; text-decoration: none; font-weight: 500; }
  `]
})
export class LoginComponent {
  loginForm;
  error = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.error = '';
    const email = this.loginForm.value.email || '';
    const password = this.loginForm.value.password || '';
    this.auth.login(email, password)
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => this.error = err.error?.error || 'Error al iniciar sesión'
      });
  }
}