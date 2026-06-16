import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService } from '../services/pedido.service';
import { MotoboyService } from '../services/motoboy.service';
import { Motoboy, Pedido } from '../models/models';

interface EntregadorComPedido extends Motoboy {
  pedidoVinculado?: Pedido | null;
}

@Component({
  selector: 'app-entregas',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './entregas.html',
  styleUrl: './entregas.scss'
})
export class EntregasComponent implements OnInit {
  motoboys: EntregadorComPedido[] = [];
  private entregadores: Motoboy[] = [];
  private pedidos: Pedido[] = [];
  pedidosAguardandoRetirada: Pedido[] = [];
  historicoEntregas: any[] = [];

  modalAtribuicaoAberto = false;
  motoboySelecionado: any = null;
  pedidoParaAtribuir: Pedido | null = null;

  modalNovoPedidoAberto = false;
  novoPedido: any = { cliente: '', telefone: '', endereco: '' };

  constructor(
    private pedidoService: PedidoService,
    private motoboyService: MotoboyService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.carregarDadosPainelEntregas();
  }

  isTabActive(route: string): boolean {
    return this.router.url === route;
  }

  logout(): void {
    this.router.navigate(['/']);
  }

  private carregarDadosPainelEntregas(): void {
    this.motoboyService.getMotoboys().subscribe(dadosMotoboys => {
      this.entregadores = dadosMotoboys;
      this.atualizarEntregadoresComPedidos();
    });

    this.pedidoService.getPedidos().subscribe((pedidos: Pedido[]) => {
      if (pedidos) {
        this.pedidos = pedidos;
        this.pedidosAguardandoRetirada = pedidos.filter(
          p => p.status === 'pronto' || (p.status === 'entrega' && !p.motoboyId)
        );
        this.atualizarEntregadoresComPedidos();
      }
    });

    this.historicoEntregas = [
      { id: 'h1', numero: '#001', motoboyNome: 'Ricardo Santos', tempo: 35 },
      { id: 'h2', numero: '#002', motoboyNome: 'André Oliveira', tempo: 42 },
      { id: 'h3', numero: '#003', motoboyNome: 'Marcos Costa', tempo: 28 }
    ];
  }

  abrirJanelaAtribuir(motoboy: any): void { this.motoboySelecionado = motoboy; this.modalAtribuicaoAberto = true; }
  fecharJanelaAtribuir(): void { this.modalAtribuicaoAberto = false; this.motoboySelecionado = null; this.pedidoParaAtribuir = null; }

  abrirJanelaAtribuirDoPedido(pedido: Pedido): void {
    this.pedidoParaAtribuir = pedido;
    const primeiroDisponivel = this.motoboys.find(m => m.status === 'disponivel');
    if (primeiroDisponivel) {
      this.vincularPedidoAoMotoboy(primeiroDisponivel.id, pedido.id);
    }
  }

  async vincularPedidoAoMotoboy(motoboyId: string, pedidoId: string): Promise<void> {
    const motoboy = this.motoboys.find(m => m.id === motoboyId);
    if (motoboy) {
      try {
        await this.motoboyService.atribuirPedido(motoboyId, pedidoId);
        this.fecharJanelaAtribuir();
      } catch (error) {
        console.error('[Entregas] Não foi possível atribuir o pedido ao entregador.', error);
        alert('Não foi possível atribuir o pedido ao entregador.');
      }
    }
  }

  async marcarEntregaComoConcluida(motoboy: EntregadorComPedido): Promise<void> {
    const pedidoId = motoboy.pedidoAtual || motoboy.pedidoVinculado?.id;

    if (!pedidoId) {
      alert('Este entregador não tem pedido vinculado.');
      return;
    }

    try {
      await this.motoboyService.finalizarEntrega(motoboy.id, pedidoId);
    } catch (error) {
      console.error('[Entregas] Não foi possível finalizar a entrega.', error);
      alert('Não foi possível finalizar a entrega.');
    }
  }

  verDetalhesMotoboy(motoboy: any): void { console.log('Inspeção do entregador:', motoboy.nome); }
  minutosDesde(pedido: Pedido): number { return Math.max(0, Math.round((Date.now() - pedido.tempoInicio.getTime()) / 60000)); }
  abrirModalNovoPedido(): void { this.modalNovoPedidoAberto = true; }
  fecharModalNovoPedido(): void { this.modalNovoPedidoAberto = false; this.novoPedido = { cliente: '', telefone: '', endereco: '' }; }
  
  salvarLancamentoPedido(): void {
    if (this.novoPedido.cliente) {
      const pedidoLancado: Pedido = {
        id: Date.now().toString(),
        numero: '#010',
        cliente: this.novoPedido.cliente,
        telefone: this.novoPedido.telefone,
        endereco: this.novoPedido.endereco,
        itens: [],
        valorTotal: 0,
        pagamento: 'Não informado',
        status: 'recebido',
        tempoInicio: new Date()
      };
      this.pedidoService.addPedido(pedidoLancado);
      this.fecharModalNovoPedido();
      this.router.navigate(['/cozinha']);
    }
  }
    modalLogoutAberto = false;

  abrirModalLogout() {
    this.modalLogoutAberto = true;
  }

  fecharModalLogout() {
    this.modalLogoutAberto = false;
  }

  confirmarSair() {
    this.modalLogoutAberto = false;
    this.router.navigate(['/login']);
  }

  private atualizarEntregadoresComPedidos(): void {
    this.motoboys = this.entregadores.map(entregador => ({
      ...entregador,
      pedidoVinculado: entregador.pedidoAtual
        ? this.pedidos.find(pedido => pedido.id === entregador.pedidoAtual) || null
        : null
    }));
  }
}
