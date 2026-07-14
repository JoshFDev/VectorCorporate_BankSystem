import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FingerprintService } from '../../services/fingerprint.service';
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

  fingerprintRegistered = false;
  fpStep: 'idle' | 'scanning1' | 'scanned1' | 'scanning2' | 'comparing' | 'registering' | 'done' | 'error' = 'idle';
  sensorConnected = false;
  fpMessage = '';

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private fingerprintService: FingerprintService,
  ) {}

  ngOnInit() {
    this.auth.ready$.subscribe((ready) => {
      if (!ready) return;
      const u = (this.auth as any).userSubject.value;
      if (!u) this.router.navigate(['/login']);
      else {
        this.loadProfile();
        this.loadFingerprintStatus();
      }
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

  private loadFingerprintStatus() {
    this.fingerprintService.getStatus().subscribe({
      next: (res) => this.fingerprintRegistered = res.registered,
      error: () => {},
    });
    this.fingerprintService.getSensorStatus().subscribe({
      next: (res) => this.sensorConnected = res.connected,
      error: () => this.sensorConnected = false,
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

  registerFingerprint() {
    this.fpStep = 'scanning1';
    this.fpMessage = '';
    this.error = '';
    this.success = '';

    this.fingerprintService.registerScan().subscribe({
      next: () => {
        this.fpStep = 'scanned1';
        this.fpMessage = 'Primer escaneo listo. Coloca el mismo dedo de nuevo.';
      },
      error: (err) => {
        this.fpStep = 'idle';
        this.error = err.error?.error || 'Error al escanear. Verifica el sensor.';
      },
    });
  }

  scanSecond() {
    this.fpStep = 'scanning2';
    this.fpMessage = '';
    this.error = '';
    this.success = '';

    this.fingerprintService.registerConfirm().subscribe({
      next: (res) => {
        if (!res.match) {
          this.fpStep = 'idle';
          this.error = res.error || 'Las huellas no coinciden. Intenta de nuevo.';
          return;
        }

        this.fpStep = 'registering';
        this.fpMessage = 'Huella verificada. Registrando en tu cuenta...';

        this.fingerprintService.register(String(res.position)).subscribe({
          next: (msg) => {
            this.fingerprintRegistered = true;
            this.fpStep = 'done';
            this.success = msg.message;
          },
          error: (err) => {
            this.fpStep = 'idle';
            this.error = err.error?.error || 'Error al registrar huella en el servidor';
          },
        });
      },
      error: (err) => {
        this.fpStep = 'idle';
        this.error = err.error?.error || 'Error al confirmar huella';
      },
    });
  }

  cancelFingerprint() {
    this.fpStep = 'idle';
    this.fpMessage = '';
    this.error = '';
    this.success = '';
  }

  removeFingerprint() {
    if (!confirm('¿Eliminar tu huella registrada? Podras registrarla de nuevo despues.')) return;

    this.error = '';
    this.success = '';

    this.fingerprintService.remove().subscribe({
      next: (res) => {
        this.fingerprintRegistered = false;
        this.success = res.message;
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al eliminar huella';
      },
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
