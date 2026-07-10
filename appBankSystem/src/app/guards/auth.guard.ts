import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ready$.pipe(
    map((ready) => {
      if (!ready) return false;
      if (auth.isLoggedIn()) return true;
      return router.parseUrl('/login');
    })
  );
};
