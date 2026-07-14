import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);

  if (req.headers.has('X-Skip-Loading')) {
    return next(req.clone({ headers: req.headers.delete('X-Skip-Loading') }));
  }

  loading.start();
  return next(req).pipe(
    finalize(() => loading.stop())
  );
};
