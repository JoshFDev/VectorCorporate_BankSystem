import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(page = 1, limit = 20, search = '', role = ''): Observable<any> {
    let url = `${this.api}/admin/users?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (role) url += `&role=${encodeURIComponent(role)}`;
    return this.http.get<any>(url);
  }

  getUser(id: string): Observable<any> {
    return this.http.get<any>(`${this.api}/admin/users/${id}`);
  }

  verifyUser(id: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/admin/users/${id}/verify`, {});
  }

  changeRole(id: string, role: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/admin/users/${id}/role`, { role });
  }

  toggleActive(id: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/admin/users/${id}/toggle-active`, {});
  }

  getAccounts(page = 1, limit = 20, type = '', status = ''): Observable<any> {
    let url = `${this.api}/admin/accounts?page=${page}&limit=${limit}`;
    if (type) url += `&type=${type}`;
    if (status) url += `&status=${status}`;
    return this.http.get<any>(url);
  }

  getAuditLogs(page = 1, limit = 20, action = '', search = ''): Observable<any> {
    let url = `${this.api}/admin/audit-logs?page=${page}&limit=${limit}`;
    if (action) url += `&action=${action}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.http.get<any>(url);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.api}/admin/stats`);
  }
}
