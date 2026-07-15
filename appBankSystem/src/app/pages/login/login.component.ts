import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FingerprintService } from '../../services/fingerprint.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm;
  focusedField = '';
  error = '';
  mode: 'password' | 'fingerprint' = 'password';
  scanning = false;
  fingerprintError = false;
  showPassword = false;
  submitting = false;
  shakeError = false;
  rememberMe = false;
  loginSuccess = false;
  greeting = '';
  passwordStrength = 0;
  passwordStrengthLabel = '';
  passwordStrengthColor = '';
  particles: { size: number; left: number; delay: number; duration: number }[] = [];

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private fp: FingerprintService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.setGreeting();
    this.generateParticles();
    this.loginForm.get('password')?.valueChanges.subscribe(val => this.calcPasswordStrength(val || ''));
    this.loadRememberMe();
  }

  private setGreeting() {
    const h = new Date().getHours();
    if (h < 12) this.greeting = 'Buenos días — revisa tu saldo en un segundo';
    else if (h < 19) this.greeting = 'Buenas tardes — agenda tu próxima transferencia';
    else this.greeting = 'Buenas noches — consulta tus movimientos del día';
  }

  private generateParticles() {
    this.particles = Array.from({ length: 15 }, () => ({
      size: Math.random() * 6 + 2,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: Math.random() * 8 + 8,
    }));
  }

  private calcPasswordStrength(pw: string) {
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;

    this.passwordStrength = Math.min(s / 5, 1);

    if (s <= 1) { this.passwordStrengthLabel = 'Débil'; this.passwordStrengthColor = '#dc2626'; }
    else if (s <= 2) { this.passwordStrengthLabel = 'Regular'; this.passwordStrengthColor = '#f59e0b'; }
    else if (s <= 3) { this.passwordStrengthLabel = 'Buena'; this.passwordStrengthColor = '#3b82f6'; }
    else { this.passwordStrengthLabel = 'Fuerte'; this.passwordStrengthColor = '#16a34a'; }
  }

  private loadRememberMe() {
    const saved = localStorage.getItem('vb_remember');
    if (saved === 'true') {
      this.rememberMe = true;
      const savedId = localStorage.getItem('vb_identifier');
      if (savedId) this.loginForm.patchValue({ identifier: savedId });
    }
  }

  toggleRememberMe() {
    this.rememberMe = !this.rememberMe;
    if (this.rememberMe) {
      localStorage.setItem('vb_remember', 'true');
      const val = this.loginForm.get('identifier')?.value;
      if (val) localStorage.setItem('vb_identifier', val);
    } else {
      localStorage.removeItem('vb_remember');
      localStorage.removeItem('vb_identifier');
    }
  }

  private saveIdentifierIfRemembered() {
    if (this.rememberMe) {
      const val = this.loginForm.get('identifier')?.value;
      if (val) localStorage.setItem('vb_identifier', val);
    }
  }

  switchMode(newMode: 'password' | 'fingerprint') {
    if (this.mode === newMode || this.scanning || this.submitting) return;
    this.error = '';
    this.fingerprintError = false;
    this.mode = newMode;
  }

  private triggerShake() {
    this.shakeError = false;
    setTimeout(() => this.shakeError = true, 10);
    setTimeout(() => this.shakeError = false, 600);
  }

  scanFingerprint() {
    const identifier = this.loginForm.get('identifier')?.value;
    if (!identifier) {
      this.error = 'Ingresa tu correo o teléfono primero';
      this.triggerShake();
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
          this.triggerShake();
          return;
        }
        this.submitting = true;
        this.auth.loginWithFingerprint(identifier, res.position!).subscribe({
          next: () => {
            this.loginSuccess = true;
            setTimeout(() => this.router.navigate(['/dashboard']), 1500);
          },
          error: (err) => {
            this.scanning = false;
            this.submitting = false;
            this.fingerprintError = true;
            this.error = err.error?.error || 'Huella no reconocida en tu cuenta';
            this.triggerShake();
          }
        });
      },
      error: (err) => {
        this.scanning = false;
        this.fingerprintError = true;
        this.error = err.error?.error || 'Error al comunicarse con el sensor';
        this.triggerShake();
      },
    });
  }

  onSubmit() {
    if (this.loginForm.invalid || this.submitting) return;
    this.error = '';
    this.submitting = true;
    this.saveIdentifierIfRemembered();
    const { identifier, password } = this.loginForm.value;
    this.auth.login(identifier!, password!)
      .subscribe({
        next: () => {
          this.loginSuccess = true;
          setTimeout(() => this.router.navigate(['/dashboard']), 1500);
        },
        error: (err) => {
          this.submitting = false;
          this.error = err.error?.error || 'Error al iniciar sesión';
          this.triggerShake();
        }
      });
  }
}
