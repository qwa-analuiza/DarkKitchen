import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, LoginCredentials } from '../services/auth'; // <-- Caminho exato baseado na árvore

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})

export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  public router = inject(Router);

  loginForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.loadRememberedEmail();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });

    this.loginForm.valueChanges.subscribe(() => {
      this.clearMessages();
    });
  }

  private loadRememberedEmail(): void {
    const rememberedEmail = this.authService.getRememberedEmail();
    if (rememberedEmail) {
      this.loginForm.patchValue({
        email: rememberedEmail,
        remember: true
      });
    }
  }

  async handleSubmit(): Promise<void> {
    console.log('1. Clique no botão detectado!');

    if (this.loginForm.invalid) {
      console.log('X. Formulário inválido!');
      this.loginForm.markAllAsTouched();
      this.showError('Por favor, preencha todos os campos corretamente.');
      return;
    } // <-- ESSA CHAVE FECHA O IF

    this.isLoading = true;
    this.clearMessages();

    const credentials: LoginCredentials = this.loginForm.value;
    console.log('2. Dados capturados do form:', credentials);

    try {
      console.log('3. Chamando o AuthService.login...');
      const result = await this.authService.login(credentials);
      console.log('4. Resposta do AuthService:', result);
      
      if (result.success) {
        console.log('5. Sucesso! Disparando o cronômetro para redirecionar...');
        this.showSuccess(result.message);
        
        setTimeout(() => {
          console.log('6. Executando o comando de navegação para /dashboard agora!');
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        console.log('X. O serviço retornou success: false. Mensagem:', result.message);
        this.showError(result.message);
      }
    } catch (error) {
      console.error('X. Caiu no bloco de erro crítico do Catch:', error);
      this.showError('Erro ao realizar login. Tente novamente.');
    } {
      this.isLoading = false;
    }
  } 
  handleForgotPassword(event: Event): void {
    event.preventDefault(); // Impede a página de recarregar por causa do href="#"
    
    console.log('Link Esqueci a Senha clicado!');
    
    // Como você pediu para redirecionar para a tela de recuperar senha:
    this.router.navigate(['/recuperar-senha']); 
  }
  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = null;

    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = null;
      }
    }, 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = null;
  }

  private clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }
} // <-- ESSA ÚLTIMA CHAVE FECHA A CLASSE LOGINCOMPONENT