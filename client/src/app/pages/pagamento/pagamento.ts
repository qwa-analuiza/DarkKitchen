import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Adicionado o Location aqui
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-pagamento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './pagamento.html',
  styleUrl: './pagamento.css'
})
export class PagamentoComponent {

  metodoSelecionado: string = 'pix';
  dadosCartao = { numero: '', nome: '', validade: '', cvv: '' };
  dadosDinheiro = { trocoPara: '' };

  constructor(
    public pedidoService: PedidoService,
    private router: Router,
    private location: Location // Injetado o Location para fazer o botão do HTML funcionar
  ) { }

  /**
   * Resolve o erro TS2339 do HTML!
   * Faz a tela voltar para a etapa de finalizar pedido
   */
  voltar() {
    this.location.back();
  }

  async confirmarPagamento() {
    try {
      const infoPagamento = {
        metodo: this.metodoSelecionado,
        detalhes: this.metodoSelecionado === 'credito' ? this.dadosCartao :
          this.metodoSelecionado === 'dinheiro' ? this.dadosDinheiro : null
      };

      // Apenas salva a escolha no serviço e segue para a revisão final
      this.pedidoService.setPagamento(infoPagamento);

      this.router.navigate(['/finalizar-pedido']);

    } catch (error: any) {
      console.error(error);
    }
  }
}