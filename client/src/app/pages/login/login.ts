import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  email: string = '';
  senha: string = '';

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  login() {
    if (!this.email || !this.senha) {
      alert('Preencha email e senha');
      return;
    }

    this.firebaseService.login(this.email, this.senha)
      .then(() => {
        this.router.navigate(['/inicio']);
      })
      .catch((error) => {
        console.error(error);
        alert('Email ou senha inválidos');
      });
  }
}
