import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth'; // <-- Importa o serviço

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService); // <-- Injeta o serviço aqui

  if (authService.isLoggedIn()) { // <-- Usa o método do serviço
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};