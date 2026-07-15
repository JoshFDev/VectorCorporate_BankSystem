import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent implements OnInit {
  emailForm;
  focusedField = '';
  error = '';
  sending = false;
  step: 'email' | 'success' = 'email';
  greeting = '';
  particles: { size: number; left: number; delay: number; duration: number }[] = [];
  private api = environment.apiUrl;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    this.setGreeting();
    this.generateParticles();
  }

  private setGreeting() {
    const h = new Date().getHours();
    if (h < 12) this.greeting = 'Buenos días — te ayudamos a recuperar tu acceso';
    else if (h < 19) this.greeting = 'Buenas tardes — no te preocupes, es rápido';
    else this.greeting = 'Buenas noches — recupera tu contraseña en minutos';
  }

  private generateParticles() {
    this.particles = Array.from({ length: 15 }, () => ({
      size: Math.random() * 6 + 2,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: Math.random() * 8 + 8,
    }));
  }

  onSubmit() {
    if (this.emailForm.invalid || this.sending) return;
    this.error = '';
    this.sending = true;
    this.http.post(`${this.api}/auth/forgot-password`, { email: this.emailForm.value.email })
      .subscribe({
        next: () => { this.step = 'success'; this.sending = false; },
        error: (err) => { this.error = err.error?.error || 'Error al enviar correo'; this.sending = false; }
      });
  }
}
