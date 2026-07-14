import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return throwError(() => err);
      }

      if (err.status === 0) {
        toast.error('Error de conexion. Verifica tu conexion a internet.');
      } else if (err.status === 403) {
        toast.error('No tienes permisos para realizar esta accion.');
      } else if (err.status === 404) {
        toast.warning('Recurso no encontrado.');
      } else if (err.status >= 500) {
        toast.error('Error del servidor. Intenta de nuevo mas tarde.');
      }

      return throwError(() => err);
    })
  );
};
