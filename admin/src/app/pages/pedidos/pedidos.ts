// Os imports e o escopo inicial permanecem idênticos ao código anterior
import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService } from '../services/pedido.service';
import { Pedido } from '../models/models';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.scss'
})
export class PedidosComponent implements OnInit {
  allPedidos: Pedido[] = [];
  filteredPedidos: Pedido[] = [];
  searchTerm = '';

  modalNovoPedidoAberto = false;
  novoPedido: any = { cliente: '', telefone: '', endereco: '' };

  modalDetalhesAberto = false;
  pedidoSelecionado: Pedido | null = null;

  constructor(
    private pedidoService: PedidoService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.escutarListaDePedidos();
  }

  isTabActive(route: string): boolean {
    return this.router.url === route;
  }

  logout(): void {
    // Redireciona o usuário para a tela inicial ou login do projeto
    this.router.navigate(['/']);
  }

  private escutarListaDePedidos(): void {
    this.pedidoService.getPedidos().subscribe((pedidos: Pedido[]) => {
      if (pedidos) {
        this.allPedidos = pedidos;
        this.filterPedidos();
      }
    });
  }

  filterPedidos(): void {
    if (!this.searchTerm) {
      this.filteredPedidos = this.allPedidos;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredPedidos = this.allPedidos.filter(p => 
        p.numero.toLowerCase().includes(term) ||
        p.cliente.toLowerCase().includes(term) ||
        p.telefone.toLowerCase().includes(term) ||
        p.endereco.toLowerCase().includes(term) ||
        p.status.toLowerCase().includes(term)
      );
    }
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'recebido': 'Recebido',
      'aguardando': 'Aguardando',
      'preparo': 'Em Preparo',
      'pronto': 'Pronto',
      'entrega': 'Em Entrega',
      'entregue': 'Entregue',
      'atrasado': 'Em Atraso'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'recebido': 'pill-recebido',
      'aguardando': 'pill-aguardando',
      'preparo': 'pill-preparo',
      'pronto': 'pill-pronto',
      'entrega': 'pill-entrega',
      'entregue': 'pill-entregue',
      'atrasado': 'pill-recebido'
    };
    return classMap[status] || 'pill-preparo';
  }

  abrirModalNovoPedido(): void { this.modalNovoPedidoAberto = true; }
  fecharModalNovoPedido(): void { this.modalNovoPedidoAberto = false; this.novoPedido = { cliente: '', telefone: '', endereco: '' }; }
  verDetalhes(pedido: Pedido): void { this.pedidoSelecionado = pedido; this.modalDetalhesAberto = true; }
  fecharModalDetalhes(): void { this.modalDetalhesAberto = false; this.pedidoSelecionado = null; }
  minutosDesde(pedido: Pedido): number { return Math.max(0, Math.round((Date.now() - pedido.tempoInicio.getTime()) / 60000)); }

  salvarLancamentoPedido(): void {
    if (this.novoPedido.cliente) {
      const novoId = (this.allPedidos.length + 1).toString();
      const novoNumero = `#00${this.allPedidos.length + 1}`;

      const pedidoLancado: Pedido = {
        id: novoId,
        numero: novoNumero,
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
}
