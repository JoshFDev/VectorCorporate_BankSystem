import { Component } from '@angular/core';
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
export class RegisterComponent {
  registerForm;
  focusedField = '';
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  error = '';
  success = '';

  countries = COUNTRIES;
  countryFilter = '';
  showCountryDropdown = false;
  countrySelected = false;

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
    this.success = '';
    this.isSubmitting = true;

    const { confirmPassword, ...data } = this.registerForm.value;
    this.auth.register(data).subscribe({
      next: () => {
        this.success = '¡Registro completado! Redirigiendo...';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al crear la cuenta. Intente nuevamente.';
        this.isSubmitting = false;
      },
    });
  }
}
