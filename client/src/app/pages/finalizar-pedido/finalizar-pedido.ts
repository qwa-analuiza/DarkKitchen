import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-finalizar-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finalizar-pedido.html',
  styleUrl: './finalizar-pedido.css'
})
export class FinalizarPedidoComponent implements OnInit {

  // Variáveis locais que o HTML vai renderizar
  endereco = { rua: 'Carregando...', numero: '', bairro: '' };
  enderecoEdicao = { rua: '', numero: '', bairro: '' };
  observacoesPedido: string = '';

  itensPedido: any[] = [];
  subtotal: number = 0;
  taxaEntrega: number = 0;
  pagamento: any = { metodo: 'Não selecionado' };

  constructor(
    private pedidoService: PedidoService, // Seu serviço que gerencia os pedidos e Firestore
    private router: Router,
    private location: Location
  ) { }

async ngOnInit() {
    console.log('📦 Inicializando Checkout com os dados reais do PedidoService...');

    // 1. Puxa os dados e valores do carrinho real salvos na transição de tela
    this.itensPedido = this.pedidoService.itensCarrinho;
    this.subtotal = this.pedidoService.subtotal;
    this.taxaEntrega = this.pedidoService.taxaEntrega;
    this.pagamento = this.pedidoService.getPagamento() || { metodo: 'Não selecionado' };

    // Se não houver itens ou pagamento, talvez o usuário tenha vindo direto.
    if (this.itensPedido.length === 0) {
      this.router.navigate(['/inicio']);
      return;
    }

    try {
      // 2. Aguarda a resposta do endereço vinda do Firestore
      const enderecoBanco = await this.pedidoService.buscarEnderecoPadrao();
      
      if (enderecoBanco) {
        // Salva o objeto completo de volta no serviço para o envio final
        this.pedidoService.setEndereco(enderecoBanco);

        // 3. Garante que se o dado for um objeto válido, ele preenche a tela perfeitamente
        if (typeof enderecoBanco === 'object') {
          this.endereco = {
            rua: enderecoBanco.rua || '',
            numero: enderecoBanco.numero || '',
            bairro: enderecoBanco.bairro || ''
          };
        } else {
          // Se por acaso o banco devolveu uma string, destrincha em objeto para não quebrar o HTML
          this.endereco = { rua: enderecoBanco, numero: '', bairro: '' };
        }
      } else {
        this.endereco = { rua: '', numero: '', bairro: '' };
      }
    } catch (error) {
      console.warn('Erro ao carregar endereço no ngOnInit:', error);
      this.endereco = { rua: '', numero: '', bairro: '' };
    }

    console.log('✅ Checkout pronto! Objeto endereço definido:', this.endereco);
  }

  // Atalho para formatar o nome do método de pagamento
  get formaPagamentoTexto(): string {
    const metodos: any = {
      'pix': 'Pix',
      'credito': 'Cartão de Crédito',
      'dinheiro': 'Dinheiro'
    };
    return metodos[this.pagamento.metodo] || 'Não selecionado';
  }

  // Atalho para calcular o total diretamente na View se necessário
  get total(): number {
    return this.subtotal + this.taxaEntrega;
  }

  voltar() {
    this.location.back();
  }

  abrirModalEndereco() {
    this.enderecoEdicao = { ...this.endereco };
    const modal = document.getElementById('modalEndereco') as HTMLDialogElement;
    if (modal) modal.showModal();
  }

  fecharModalEndereco() {
    const modal = document.getElementById('modalEndereco') as HTMLDialogElement;
    if (modal) modal.close();
  }

  salvarNovoEndereco() {
    this.endereco = { ...this.enderecoEdicao };
    this.pedidoService.setEndereco(this.endereco); // Atualiza no serviço usando seu método real
    this.fecharModalEndereco();
  }

  // 🍔 FUNÇÃO DE FINALIZAÇÃO CORRIGIDA
  async finalizarPedido() {
    // Sincroniza a observação digitada na tela com o seu PedidoService antes de salvar
    this.pedidoService.observacoesPedido = this.observacoesPedido;

    if (!this.pagamento || this.pagamento.metodo === 'Não selecionado') {
      alert('Por favor, selecione uma forma de pagamento.');
      this.router.navigate(['/pagamento']);
      return;
    }

    console.log('Enviando e registrando pedido no Firebase Firestore...');

    try {
      // 1. Chama a função real do seu PedidoService que salva no Firebase e retorna o ID string
      const idPedidoFirebase = await this.pedidoService.salvarPedidoNoFirestore(this.pagamento);
      
      console.log('✅ Pedido gravado no banco de dados com Sucesso! ID:', idPedidoFirebase);
      
      // 2. Redireciona para a tela de confirmação, PASSANDO o ID gerado pelo Firebase na URL
      this.router.navigate(['/pedido-confirmado'], { 
        queryParams: { id: idPedidoFirebase } 
      });

    } catch (error) {
      console.error('❌ Erro crítico ao tentar gravar o pedido no Firestore:', error);
      alert('Houve um problema ao processar seu pedido no Firebase. Tente novamente.');
    }
  }
}
