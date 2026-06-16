import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { PedidoService } from '../services/pedido.service';
import { MotoboyService } from '../services/motoboy.service';
import { Pedido } from '../models/models';
import { RouterLink, RouterLinkActive } from '@angular/router';


@Component({
  selector: 'app-cozinha',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './cozinha.html',
  styleUrl: './cozinha.scss'
})
export class CozinhaComponent implements OnInit {
  pedidosRecebidos: Pedido[] = [];
  pedidosAguardando: Pedido[] = [];
  pedidosPreparo: Pedido[] = [];
  pedidosProntos: Pedido[] = [];
  motoboys: any[] = []; // Armazena a listagem vinda do serviço para o pop-up

  // Estados dos Modais
  modalAberto = false;
  modalAtribuirAberto = false;
  pedidoSelecionado: Pedido | null = null;

  constructor(
    private pedidoService: PedidoService,
    private motoboyService: MotoboyService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.escutarFluxoDePedidos();
    this.escutarMotoboys();
  }

  minutosDesde(pedido: Pedido): number {
    return Math.max(0, Math.round((Date.now() - pedido.tempoInicio.getTime()) / 60000));
  }

  private escutarFluxoDePedidos(): void {
    this.pedidoService.getPedidos().subscribe((pedidos: Pedido[]) => {
      if (pedidos) {
        this.pedidosRecebidos = pedidos.filter(p => p.status === 'recebido');
        this.pedidosAguardando = pedidos.filter(p => p.status === 'aguardando');
        this.pedidosPreparo = pedidos.filter(p => p.status === 'preparo');
        this.pedidosProntos = pedidos.filter(p => p.status === 'pronto');
      }
    });
  }

  private escutarMotoboys(): void {
    this.motoboyService.getMotoboys().subscribe(dadosMotoboys => {
      this.motoboys = dadosMotoboys;
    });
  }

  async moverParaAguardando(pedido: Pedido): Promise<void> {
    await this.alterarStatusPedido(pedido, 'aguardando');
  }

  async moverParaPreparo(pedido: Pedido): Promise<void> {
    await this.alterarStatusPedido(pedido, 'preparo');
  }

  async moverParaPronto(pedido: Pedido): Promise<void> {
    await this.alterarStatusPedido(pedido, 'pronto');
  }

  private async alterarStatusPedido(pedido: Pedido, status: Pedido['status']): Promise<void> {
    try {
      await this.pedidoService.updatePedidoStatus(pedido.id, status);
    } catch (error) {
      console.error(`[Cozinha] Não foi possível alterar o pedido ${pedido.numero} para ${status}.`, error);
      alert('Não foi possível atualizar o pedido. Verifique sua conexão e as regras do Firestore.');
    }
  }

  // Abre o Pop-up de seleção de motoboy
  abrirAtribuirMotoboy(pedido: Pedido): void {
    this.pedidoSelecionado = pedido;
    this.modalAtribuirAberto = true;
  }

  fecharAtribuirMotoboy(): void {
    this.modalAtribuirAberto = false;
    this.pedidoSelecionado = null;
  }

  // Executa a atribuição final e despacha para entrega
  async confirmarAtribuicao(motoboyId: string): Promise<void> {
    if (this.pedidoSelecionado) {
      try {
        // 1. Vincula o motoboy ao pedido no serviço de entregas global
        await this.motoboyService.atribuirPedido(motoboyId, this.pedidoSelecionado.id);

        // 2. Fecha o pop-up de motoboys
        this.fecharAtribuirMotoboy();
      } catch (error) {
        console.error('[Cozinha] Não foi possível atribuir o motoboy ao pedido.', error);
        alert('Não foi possível atribuir o motoboy ao pedido.');
      }
    }
  }
  navigateTo(route: string): void {
  this.router.navigateByUrl(route);
}

isTabActive(route: string): boolean {
  return this.router.url === route;
}

  abrirDetalhes(pedido: Pedido): void {
    this.pedidoSelecionado = pedido;
    this.modalAberto = true;
  }

  fecharDetalhes(): void {
    this.modalAberto = false;
    this.pedidoSelecionado = null;
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
}
