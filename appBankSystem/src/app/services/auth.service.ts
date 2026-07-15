import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, switchMap, catchError, of, throwError } from 'rxjs';
import { environment } from '../environments/environment';

interface AuthResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'vectorbank_token';
  private refreshKey = 'vectorbank_refresh';
  private userSubject = new BehaviorSubject<any>(null);
  private readySubject = new BehaviorSubject<boolean>(false);
  private refreshInProgress = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  user$ = this.userSubject.asObservable();
  ready$ = this.readySubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      this.loadUser();
    } else {
      this.readySubject.next(true);
    }
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(res => this.setSession(res))
    );
  }

  login(identifier: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email: identifier, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  loginWithFingerprint(identifier: string, sensorPosition: number): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login-fingerprint`, { email: identifier, sensorPosition }).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    this.userSubject.next(null);
    this.readySubject.next(true);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  refreshAccessToken(): Observable<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return of(null);

    if (this.refreshInProgress) {
      return this.refreshSubject.asObservable();
    }

    this.refreshInProgress = true;

    return this.http.post<{ token: string; refreshToken: string }>(
      `${this.apiUrl}/auth/refresh`,
      { refreshToken }
    ).pipe(
      tap(res => {
        localStorage.setItem(this.tokenKey, res.token);
        localStorage.setItem(this.refreshKey, res.refreshToken);
        this.refreshSubject.next(res.token);
        this.refreshInProgress = false;
      }),
      catchError(() => {
        this.refreshInProgress = false;
        this.refreshSubject.next(null);
        this.logout();
        return of(null);
      }),
      switchMap(res => res ? of(res.token) : of(null))
    );
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(this.tokenKey, res.token);
    if (res.refreshToken) {
      localStorage.setItem(this.refreshKey, res.refreshToken);
    }
    this.userSubject.next(res.user);
    this.readySubject.next(true);
  }

  private loadUser(): void {
    const token = this.getToken();
    if (!token) {
      this.readySubject.next(true);
      return;
    }
    this.http.get<any>(`${this.apiUrl}/users/me`).subscribe({
      next: (res) => {
        this.userSubject.next(res.user);
        this.readySubject.next(true);
      },
      error: () => {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshKey);
        this.userSubject.next(null);
        this.readySubject.next(true);
      }
    });
  }
}
