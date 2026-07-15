import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class FingerprintService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<{ registered: boolean; position?: string | null }> {
    return this.http.get<{ registered: boolean; position?: string | null }>(`${this.api}/fingerprint/status`);
  }

  register(sensorId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/fingerprint/register`, { fingerprint: sensorId });
  }

  remove(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/fingerprint/remove`);
  }

  getSensorStatus(): Observable<{ connected: boolean; port?: string; templates?: number; error?: string }> {
    return this.http.get<{ connected: boolean; port?: string; templates?: number; error?: string }>(`${this.api}/sensor/status`);
  }

  identify(): Observable<{ found: boolean; position?: number; accuracy?: number; error?: string }> {
    return this.http.post<{ found: boolean; position?: number; accuracy?: number; error?: string }>(`${this.api}/sensor/identify`, {});
  }

  registerScan(): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${this.api}/sensor/register-scan`, {});
  }

  registerConfirm(): Observable<{ match: boolean; position?: number; error?: string }> {
    return this.http.post<{ match: boolean; position?: number; error?: string }>(`${this.api}/sensor/register-confirm`, {});
  }

  deleteTemplate(position: number): Observable<{ deleted: boolean; position: number }> {
    return this.http.delete<{ deleted: boolean; position: number }>(`${this.api}/sensor/delete-template/${position}`);
  }

  deleteAllTemplates(): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(`${this.api}/sensor/delete-all`);
  }
}
