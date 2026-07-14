import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanMatchFn = () => {
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

export function roleGuard(...allowedRoles: string[]): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.user$.pipe(
      take(1),
      map((user) => {
        if (user && allowedRoles.includes(user.role)) return true;
        return router.parseUrl('/dashboard');
      })
    );
  };
}
