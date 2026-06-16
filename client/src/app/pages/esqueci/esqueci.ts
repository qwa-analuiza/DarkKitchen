import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-esqueci',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './esqueci.html',
  styleUrl: './esqueci.css'
})
export class EsqueciComponent {

  email: string = '';

  constructor(private firebaseService: FirebaseService) {}

  enviarReset() {

    if (!this.email) {
      alert('Digite um email');
      return;
    }

    this.firebaseService.resetPassword(this.email)
      .then(() => {
        alert('Email de recuperação enviado!');
      })
      .catch((error) => {
        console.error(error);
        alert('Erro ao enviar email');
      });
  }
}
