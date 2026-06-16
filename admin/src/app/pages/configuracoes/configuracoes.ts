import { Component } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './configuracoes.html',
  styleUrl: './configuracoes.scss'
})
export class ConfiguracoesComponent {
  abaAtiva: 'restaurante' | 'equipe' | 'motoboys' = 'restaurante';
  modalCadastroAberto = false;
  tipoCadastro: 'equipe' | 'motoboy' = 'equipe';
  fotoPreview: string | null = null;
  modalLogoutAberto = false;

  dadosRestaurante = {
    nome: 'Sabor na Brasa',
    telefone: '(11) 98765-4321',
    cep: '01001-000',
    endereco: 'Avenida das Nações Queimadas, 1420 - São Paulo, SP',
    taxaEntrega: 7.50,
    horarioAbertura: '11:00',
    horarioFechamento: '23:00',
    sobre: 'Dark Kitchen especializada em cortes na brasa e entregas rápidas com alto padrão de suculência.'
  };

  equipe = [
    { id: 1, nome: 'Carlos', sobrenome: 'Silva', cargo: 'Gerente', cpf: '123.456.789-10', telefone: '(11) 91111-2222', cep: '04571-010', foto: '', ativo: true },
    { id: 2, nome: 'Maria', sobrenome: 'Santos', cargo: 'Cozinha', cpf: '987.654.321-00', telefone: '(11) 93333-4444', cep: '03102-005', foto: '', ativo: true }
  ];

  motoboys = [
    { id: 101, nome: 'Ricardo', sobrenome: 'Santos', cnh: '4457812930', cpf: '444.555.666-77', telefone: '(11) 95555-6666', cep: '08210-090', entregas: 145, foto: '', ativo: true },
    { id: 102, nome: 'Fernando', sobrenome: 'Lima', cnh: '8897412351', cpf: '222.333.444-55', telefone: '(11) 97777-8888', cep: '05011-000', entregas: 203, foto: '', ativo: true }
  ];

  novoMembro = {
    nome: '', sobrenome: '', cpf: '', telefone: '', cep: '', cargo: 'Cozinha', cnh: '', foto: ''
  };

  constructor(public router: Router) {}

  mudarAba(aba: 'restaurante' | 'equipe' | 'motoboys') { this.abaAtiva = aba; }
  abrirModalLogout() { this.modalLogoutAberto = true; }
  fecharModalLogout() { this.modalLogoutAberto = false; }
  confirmarSair() { this.modalLogoutAberto = false; this.router.navigate(['/login']); }
  salvarDadosRestaurante() { alert('Configurações do restaurante salvas com sucesso!'); }

  abrirModalMembro(tipo: 'equipe' | 'motoboy') {
    this.tipoCadastro = tipo;
    this.fotoPreview = null;
    this.novoMembro = { nome: '', sobrenome: '', cpf: '', telefone: '', cep: '', cargo: 'Cozinha', cnh: '', foto: '' };
    this.modalCadastroAberto = true;
  }

  fecharModal() { this.modalCadastroAberto = false; }

  aoSelecionarFoto(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPreview = reader.result as string;
        this.novoMembro.foto = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  adicionarMembro() {
    if (!this.novoMembro.nome.trim() || !this.novoMembro.sobrenome.trim()) return;
    if (this.tipoCadastro === 'equipe') {
      this.equipe.push({ id: Date.now(), nome: this.novoMembro.nome, sobrenome: this.novoMembro.sobrenome, cargo: this.novoMembro.cargo, cpf: this.novoMembro.cpf, telefone: this.novoMembro.telefone, cep: this.novoMembro.cep, foto: this.novoMembro.foto, ativo: true });
    } else {
      this.motoboys.push({ id: Date.now(), nome: this.novoMembro.nome, sobrenome: this.novoMembro.sobrenome, cnh: this.novoMembro.cnh, cpf: this.novoMembro.cpf, telefone: this.novoMembro.telefone, cep: this.novoMembro.cep, entregas: 0, foto: this.novoMembro.foto, ativo: true });
    }
    this.fecharModal();
  }

  removerMembro(id: number, tipo: 'equipe' | 'motoboy') {
    if (tipo === 'equipe') this.equipe = this.equipe.filter(m => m.id !== id);
    else this.motoboys = this.motoboys.filter(m => m.id !== id);
  }

  alternarAtivo(membro: any) { membro.ativo = !membro.ativo; }
}
