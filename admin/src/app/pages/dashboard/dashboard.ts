import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PedidoService } from '../services/pedido.service';
import { MotoboyService } from '../services/motoboy.service';
import { AuthService } from '../services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  pedidosAtivos = 0;
  emPreparo = 0;
  emEntrega = 0;
  pedidosAtraso = 0;
  motoboysDisponiveis = 0;
  totalMotoboys = 0;
  atividades: any[] = [];
  private subscriptions = new Subscription();

  constructor(
    private pedidoService: PedidoService,
    private motoboyService: MotoboyService,
    private authService: AuthService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadData(): void {
    const sub = this.pedidoService.getPedidos().subscribe(pedidos => {
      this.pedidosAtivos = pedidos.filter(p => p.status !== 'entregue').length;
      this.emPreparo = pedidos.filter(p => p.status === 'preparo').length;
      this.emEntrega = pedidos.filter(p => p.status === 'entrega').length;
      this.pedidosAtraso = pedidos.filter(p => p.status === 'atrasado').length;
      this.atividades = pedidos.slice(0, 5).map(p => ({
        titulo: p.status === 'entregue' ? 'Entrega concluída' : p.status === 'entrega' ? 'Saiu para entrega' : p.status === 'preparo' ? 'Pedido em preparo' : 'Novo pedido recebido',
        descricao: `Pedido ${p.numero} - ${p.cliente}`,
        minutos: Math.max(0, Math.round((Date.now() - p.tempoInicio.getTime()) / 60000))
      }));
    });
    this.subscriptions.add(sub);
    this.subscriptions.add(
      this.motoboyService.getMotoboys().subscribe(motoboys => {
        this.totalMotoboys = motoboys.length;
        this.motoboysDisponiveis = motoboys.filter(m => m.status === 'disponivel').length;
      })
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  // Força o redirecionamento imediato via código nativo do TS
  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  // Verifica se a aba deve ficar amarela baseado no endereço ativo
  isTabActive(route: string): boolean {
    return this.router.url === route;
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
