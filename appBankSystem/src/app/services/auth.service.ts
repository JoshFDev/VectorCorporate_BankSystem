import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

interface AuthResponse {
  message: string;
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'vectorbank_token';
  private userSubject = new BehaviorSubject<any>(null);
  private readySubject = new BehaviorSubject<boolean>(false);

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

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.userSubject.next(null);
    this.readySubject.next(true);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(this.tokenKey, res.token);
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
        this.userSubject.next(null);
        this.readySubject.next(true);
      }
    });
  }
}
