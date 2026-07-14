import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || req.url.includes('/auth/refresh') || req.url.includes('/users/me')) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        return auth.refreshAccessToken().pipe(
          switchMap((newToken) => {
            if (!newToken) return throwError(() => error);
            const cloned = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });
            return next(cloned);
          })
        );
      }

      isRefreshing = true;
      return auth.refreshAccessToken().pipe(
        switchMap((newToken) => {
          isRefreshing = false;
          if (!newToken) return throwError(() => error);
          const cloned = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          });
          return next(cloned);
        }),
        catchError((err) => {
          isRefreshing = false;
          return throwError(() => err);
        })
      );
    })
  );
};
