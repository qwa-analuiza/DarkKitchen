import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-recuperar-senha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recuperar-senha.html',
  styleUrl: './recuperar-senha.scss'
})
export class RecuperarSenhaComponent {
  emailLogin: string = '';

  constructor(public router: Router, private authService: AuthService) {}

  async enviarInstrucoes(): Promise<void> {
    if (!this.emailLogin.trim()) {
      alert('Por favor, insira o seu e-mail de login.');
      return;
    }

    try {
      const result = await this.authService.forgotPassword(this.emailLogin);
      alert(result.message);
      if (result.success) this.router.navigate(['/login']);
    } catch {
      alert('Não foi possível enviar as instruções de recuperação.');
    }
  }
}
