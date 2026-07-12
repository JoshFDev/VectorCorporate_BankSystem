import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  @ViewChild('photoInput') photoInput!: ElementRef;

  user: any = null;
  loading = true;
  saving = false;
  error = '';
  success = '';
  editMode: Record<string, boolean> = {};
  uploadingPhoto = false;

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    this.auth.ready$.subscribe((ready) => {
      if (!ready) return;
      const u = (this.auth as any).userSubject.value;
      if (!u) this.router.navigate(['/login']);
      else this.loadProfile();
    });
  }

  private loadProfile() {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/users/me`).subscribe({
      next: (res) => {
        this.user = res.user;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar perfil';
        this.loading = false;
      },
    });
  }

  toggleEdit(field: string) {
    this.editMode[field] = !this.editMode[field];
    this.error = '';
    this.success = '';
  }

  saveField(field: string, value: string) {
    this.saving = true;
    this.error = '';
    this.success = '';
    this.http.put(`${environment.apiUrl}/users/me`, { [field]: value }).subscribe({
      next: () => {
        this.user[field] = value;
        this.editMode[field] = false;
        this.success = 'Datos actualizados';
        this.saving = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al actualizar';
        this.saving = false;
      },
    });
  }

  get photoUrl(): string {
    if (!this.user?.id) return '';
    return `${environment.apiUrl}/users/${this.user.id}/photo?t=${new Date().getTime()}`;
  }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.error = 'Solo se permiten imagenes'; return; }
    if (file.size > 2 * 1024 * 1024) { this.error = 'Maximo 2MB'; return; }

    this.uploadingPhoto = true;
    this.error = '';
    this.success = '';

    const reader = new FileReader();
    reader.onload = () => {
      this.http.put(`${environment.apiUrl}/users/me/photo`, { photo: reader.result }).subscribe({
        next: () => {
          this.user.hasPhoto = true;
          this.success = 'Foto actualizada';
          this.uploadingPhoto = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Error al subir foto';
          this.uploadingPhoto = false;
        },
      });
    };
    reader.readAsDataURL(file);
  }

  removePhoto() {
    this.http.put(`${environment.apiUrl}/users/me/photo`, { photo: null }).subscribe({
      next: () => {
        this.user.hasPhoto = false;
        this.success = 'Foto eliminada';
      },
      error: () => { this.error = 'Error al eliminar foto'; },
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  fieldLabel(f: string): string {
    const labels: Record<string, string> = {
      name: 'Nombre completo', email: 'Correo electrónico', phone: 'Teléfono',
      address: 'Dirección', occupation: 'Ocupación',
    };
    return labels[f] || f;
  }

  roleLabel(r: string): string {
    const labels: Record<string, string> = {
      client: 'Cliente', teller: 'Cajero', supervisor: 'Supervisor', admin: 'Administrador',
    };
    return labels[r] || r;
  }

  logout() {
    this.auth.logout();
  }
}
