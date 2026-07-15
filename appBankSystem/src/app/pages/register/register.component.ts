import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { COUNTRIES } from './countries';

function curpValidator(control: AbstractControl): ValidationErrors | null {
  const curp = control.value;
  if (!curp) return null;
  return /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(curp.toUpperCase()) ? null : { curpInvalid: true };
}

function nameValidator(control: AbstractControl): ValidationErrors | null {
  return !control.value || control.value.trim().length >= 2 ? null : { nameInvalid: true };
}

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return /^\d{7,15}$/.test(control.value.replace(/[\s\-()]/g, '')) ? null : { phoneInvalid: true };
}

function ageValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const birth = new Date(control.value);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 < 18 ? { ageInvalid: true } : null;
  }
  return age < 18 ? { ageInvalid: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  registerForm;
  focusedField = '';
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  error = '';
  success = '';
  showSuccess = false;

  step: 'form' | 'code' | 'success' = 'form';
  verificationCode = ['', '', '', '', '', ''];
  codeError = '';
  isSendingCode = false;
  isVerifyingCode = false;
  codeResendTimer = 0;
  private resendInterval: any;

  countries = COUNTRIES;
  countryFilter = '';
  showCountryDropdown = false;
  countrySelected = false;

  particles: { x: number; y: number; size: number; duration: number; delay: number }[] = [];
  greeting = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, nameValidator]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      dni: ['', [Validators.required, curpValidator]],
      phone: ['', [Validators.required, phoneValidator]],
      address: [''],
      dateOfBirth: ['', [Validators.required, ageValidator]],
      nationality: ['México'],
      occupation: [''],
    });
  }

  ngOnInit() {
    this.generateParticles();
    this.setGreeting();
  }

  generateParticles() {
    this.particles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 4,
    }));
  }

  setGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Buenos días';
    else if (hour < 19) this.greeting = 'Buenas tardes';
    else this.greeting = 'Buenas noches';
  }

  get filteredCountries(): string[] {
    if (!this.countryFilter) return this.countries;
    const f = this.countryFilter.toLowerCase();
    return this.countries.filter(c => c.toLowerCase().startsWith(f));
  }

  selectCountry(country: string) {
    this.registerForm.patchValue({ nationality: country });
    this.countryFilter = country;
    this.showCountryDropdown = false;
    this.countrySelected = true;
  }

  onCountryBlur() {
    setTimeout(() => {
      this.showCountryDropdown = false;
      if (!this.countrySelected && this.countryFilter) {
        this.registerForm.patchValue({ nationality: this.countryFilter });
      }
    }, 200);
  }

  onCountryFocus() {
    this.focusedField = 'nationality';
    this.showCountryDropdown = true;
    if (!this.countrySelected) {
      this.countryFilter = '';
    }
  }

  onCountryInput() {
    this.countrySelected = false;
    this.showCountryDropdown = true;
    this.registerForm.patchValue({ nationality: this.countryFilter });
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.touched) return '';
    if (control.hasError('required')) {
      const map: Record<string, string> = {
        name: 'Campo requerido', email: 'Campo requerido',
        password: 'Campo requerido', confirmPassword: 'Campo requerido',
        dni: 'Campo requerido', phone: 'Campo requerido', dateOfBirth: 'Campo requerido',
      };
      return map[controlName] || 'Campo requerido';
    }
    if (control.hasError('email')) return 'Formato de correo no válido';
    if (control.hasError('curpInvalid')) return 'CURP inválido (AAAA000000AAAAAAAA00)';
    if (control.hasError('ageInvalid')) return 'Debes ser mayor de 18 años';
    if (control.hasError('nameInvalid')) return 'Mínimo 2 caracteres';
    if (control.hasError('minlength')) return 'Mínimo 6 caracteres';
    if (control.hasError('phoneInvalid')) return 'Teléfono inválido';
    return '';
  }

  get passwordsMismatch(): boolean {
    const p = this.registerForm.get('password')?.value;
    const c = this.registerForm.get('confirmPassword')?.value;
    return !!p && !!c && p !== c;
  }

  get passwordStrength(): string {
    const pwd: string = this.registerForm.get('password')?.value || '';
    if (pwd.length < 6) return 'weak';
    if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /\d/.test(pwd) && /[^a-z0-9]/i.test(pwd)) return 'strong';
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /\d/.test(pwd)) return 'medium';
    return 'weak';
  }

  get passwordStrengthPercent(): number {
    return { weak: 33, medium: 66, strong: 100 }[this.passwordStrength] || 0;
  }

  get passwordStrengthLabel(): string {
    return { weak: 'Débil', medium: 'Media', strong: 'Fuerte' }[this.passwordStrength] || '';
  }

  get passwordStrengthColor(): string {
    return { weak: '#dc2626', medium: '#d97706', strong: '#059669' }[this.passwordStrength] || '';
  }

  get passwordStrengthBg(): string {
    return { weak: '#fef2f2', medium: '#fffbeb', strong: '#f0fdf4' }[this.passwordStrength] || '';
  }

  get maskedEmail(): string {
    const email = this.registerForm.get('email')?.value || '';
    const [user, domain] = email.split('@');
    if (!domain) return email;
    const masked = user.length > 2
      ? user[0] + '***' + user[user.length - 1]
      : user[0] + '***';
    return `${masked}@${domain}`;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    if (this.passwordsMismatch) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }
    this.error = '';
    this.isSendingCode = true;

    const email = this.registerForm.get('email')?.value!;
    this.auth.sendVerificationCode(email).subscribe({
      next: (res) => {
        this.isSendingCode = false;
        this.step = 'code';
        this.codeResendTimer = 60;
        this.startResendTimer();
        if (res.code) {
          console.log('Código de verificación (dev):', res.code);
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al enviar código. Intente nuevamente.';
        this.isSendingCode = false;
      },
    });
  }

  onCodeInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    if (value.length === 1) {
      this.verificationCode[index] = value;
      if (index < 5) {
        const next = input.parentElement?.querySelector(`input:nth-child(${index + 2})`) as HTMLInputElement;
        next?.focus();
      }
    } else {
      this.verificationCode[index] = '';
    }

    if (value.length > 1) {
      this.verificationCode[index] = value[0];
    }
  }

  onCodeKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.verificationCode[index] && index > 0) {
      const prev = (event.target as HTMLElement).parentElement?.querySelector(`input:nth-child(${index})`) as HTMLInputElement;
      prev?.focus();
    }
  }

  onCodePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '') || '';
    for (let i = 0; i < Math.min(6, pasted.length); i++) {
      this.verificationCode[i] = pasted[i];
    }
    const inputs = document.querySelectorAll('.code-inputs input');
    const focusIndex = Math.min(pasted.length, 5);
    (inputs[focusIndex] as HTMLInputElement)?.focus();
  }

  verifyCode(): void {
    const code = this.verificationCode.join('');
    if (code.length !== 6) {
      this.codeError = 'Ingresa los 6 dígitos';
      return;
    }

    this.codeError = '';
    this.isVerifyingCode = true;
    const email = this.registerForm.get('email')?.value!;

    this.auth.verifyEmailCode(email, code).subscribe({
      next: () => {
        this.registerUser();
      },
      error: (err) => {
        this.codeError = err.error?.error || 'Código inválido';
        this.isVerifyingCode = false;
        this.verificationCode = ['', '', '', '', '', ''];
        const inputs = document.querySelectorAll('.code-inputs input');
        (inputs[0] as HTMLInputElement)?.focus();
      },
    });
  }

  private registerUser(): void {
    this.isVerifyingCode = true;
    const { confirmPassword, ...data } = this.registerForm.value;
    this.auth.register(data).subscribe({
      next: () => {
        this.isVerifyingCode = false;
        this.step = 'success';
        this.showSuccess = true;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.step = 'form';
        this.error = err.error?.error || 'Error al crear la cuenta. Intente nuevamente.';
        this.isVerifyingCode = false;
      },
    });
  }

  private startResendTimer(): void {
    if (this.resendInterval) clearInterval(this.resendInterval);
    this.resendInterval = setInterval(() => {
      this.codeResendTimer--;
      if (this.codeResendTimer <= 0) {
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  resendCode(): void {
    if (this.codeResendTimer > 0) return;
    this.codeError = '';
    const email = this.registerForm.get('email')?.value!;
    this.auth.sendVerificationCode(email).subscribe({
      next: () => {
        this.codeResendTimer = 60;
        this.startResendTimer();
      },
      error: () => {
        this.codeError = 'Error al reenviar código';
      },
    });
  }

  backToForm(): void {
    this.step = 'form';
    this.verificationCode = ['', '', '', '', '', ''];
    this.codeError = '';
  }
}
