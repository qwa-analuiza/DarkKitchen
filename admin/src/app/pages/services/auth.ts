import { Injectable } from '@angular/core';

// Interface declarada aqui para evitar imports circulares cruzados
export interface LoginCredentials {
  email: string;
  password?: string;
  remember?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly mockEmail = 'admin@sabornabrasa.com';
  private readonly mockPassword = 'admin123';

  /**
   * Autentica o administrador localmente.
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string }> {
    if (credentials.email === this.mockEmail && credentials.password === this.mockPassword) {
      const userData = {
        email: this.mockEmail,
        name: 'Gerente',
        role: 'admin',
        loginTime: new Date().toISOString()
      };

      sessionStorage.setItem('adminAuthenticated', this.mockEmail);
      sessionStorage.setItem('user', JSON.stringify(userData));

      credentials.remember
        ? localStorage.setItem('rememberedEmail', credentials.email)
        : localStorage.removeItem('rememberedEmail');

      return { success: true, message: 'Autenticação realizada com sucesso!' };
    }

    return { success: false, message: 'E-mail ou senha inválidos.' };
  }

  /**
   * Métodos utilizados pela Dashboard e pelo Guard
   */
  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  isLoggedIn(): boolean {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem('adminAuthenticated') !== null;
    }
    return false;
  }

  getCurrentUser(): any {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const user = sessionStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  getRememberedEmail(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('rememberedEmail');
    }
    return null;
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('user');
    }
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return {
      success: email === this.mockEmail,
      message: email === this.mockEmail
        ? `Credenciais de acesso: ${this.mockEmail} / ${this.mockPassword}`
        : 'E-mail não cadastrado.'
    };
  }
}
