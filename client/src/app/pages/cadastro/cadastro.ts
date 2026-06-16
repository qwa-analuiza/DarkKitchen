import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css'
})
export class CadastroComponent {

  nome: string = '';
  email: string = '';
  senha: string = '';
  confirmarSenha: string = '';

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  cadastrar() {

    if (!this.nome || !this.email || !this.senha || !this.confirmarSenha) {
      alert('Preencha todos os campos');
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      alert('As senhas não conferem');
      return;
    }

    if (this.senha.length < 6) {
      alert('A senha precisa ter no mínimo 6 caracteres');
      return;
    }

    this.firebaseService.register(this.email, this.senha)
      .then(async (cred) => {
        if (cred.user) {
          await this.firebaseService.salvarPerfilUsuario(cred.user.uid, {
            nome: this.nome,
            email: this.email,
            dataCadastro: new Date()
          });
        }
        alert('Conta criada com sucesso!');
        this.router.navigate(['/inicio']);
      })
      .catch((error) => {
        console.error(error);
        alert('Erro ao criar conta');
      });
  }
}
