import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) {
        const isUsersMe = req.url.includes('/users/me');
        if (!isUsersMe) {
          localStorage.removeItem('vectorbank_token');
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
