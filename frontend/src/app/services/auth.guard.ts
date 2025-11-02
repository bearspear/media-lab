import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is already authenticated (has valid user object)
  const currentUser = authService.getCurrentUser();
  const hasToken = authService.isAuthenticated();

  console.log('[AuthGuard] Checking auth - currentUser:', !!currentUser, 'hasToken:', hasToken);

  if (currentUser) {
    console.log('[AuthGuard] User authenticated, allowing access');
    return true;
  }

  // No user but has token - it might be in the process of verification
  // or the token is invalid. Let the page load and let components handle it.
  if (hasToken) {
    console.log('[AuthGuard] Has token but no user yet, allowing access (verification pending)');
    return true;
  }

  // No token at all - redirect to login
  console.log('[AuthGuard] No token, redirecting to login');
  router.navigate(['/login']);
  return false;
};
