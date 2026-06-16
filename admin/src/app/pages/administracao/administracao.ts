import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService } from '../services/pedido.service';

@Component({
  selector: 'app-administracao',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './administracao.html',
  styleUrl: './administracao.scss'
})
export class AdministracaoComponent implements OnInit {
  
  // Variáveis que o HTML lê de forma reativa
  faturamentoHoje = 0;
  totalPedidos = 0;
  ticketMedio = 0;
  pedidosAtraso = 0;
  tempoMedio = 0;

  vendasSemanaLayout = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    .map(dia => ({ dia, valor: 0 }));

  produtosMaisVendidos: any[] = [];

  // Percentuais do gráfico de pizza nativo em SVG
  pctEntregue = 0;
  pctPreparo = 0;
  pctAguardando = 0;
  pctEntrega = 0;

  // Offsets dinâmicos para renderizar os pedaços da pizza do SVG
  offsetPreparo = 0;
  offsetAguardando = 0;
  offsetEntrega = 0;

  constructor(private pedidoService: PedidoService, public router: Router) {}

  ngOnInit(): void {
    this.carregarMetricasReais();
  }

  carregarMetricasReais(): void {
    this.pedidoService.getPedidos().subscribe(pedidos => {
      const finalizados = pedidos.filter(p => p.status === 'entregue');
      this.faturamentoHoje = finalizados.reduce((total, p) => total + p.valorTotal, 0);
      this.totalPedidos = pedidos.length;
      this.ticketMedio = this.faturamentoHoje / (finalizados.length || 1);
      this.pedidosAtraso = pedidos.filter(p => p.status === 'atrasado').length;
      this.tempoMedio = finalizados.length
        ? Math.round(finalizados.reduce((total, p) => total + (Date.now() - p.tempoInicio.getTime()) / 60000, 0) / finalizados.length)
        : 0;

      const statusContagem = {
        entregue: pedidos.filter(p => p.status === 'entregue').length,
        preparo: pedidos.filter(p => p.status === 'preparo').length,
        entrega: pedidos.filter(p => p.status === 'entrega').length,
        aguardando: pedidos.filter(p => ['aguardando', 'pronto', 'recebido'].includes(p.status)).length
      };
      const totalStatus = pedidos.length;
    
      if (totalStatus > 0) {
        this.pctEntregue = (statusContagem.entregue / totalStatus) * 100;
        this.pctPreparo = (statusContagem.preparo / totalStatus) * 100;
        this.pctAguardando = (statusContagem.aguardando / totalStatus) * 100;
        this.pctEntrega = (statusContagem.entrega / totalStatus) * 100;

        this.offsetPreparo = -this.pctEntregue;
        this.offsetAguardando = -(this.pctEntregue + this.pctPreparo);
        this.offsetEntrega = -(this.pctEntregue + this.pctPreparo + this.pctAguardando);
      }

      const semana = this.vendasSemanaLayout.map(item => ({ ...item, valor: 0 }));
      finalizados.forEach(p => semana[p.tempoInicio.getDay()].valor += p.valorTotal);
      this.vendasSemanaLayout = semana;

      const produtos = new Map<string, { vendas: number; receita: number }>();
      finalizados.flatMap(p => p.itens).forEach(item => {
        const atual = produtos.get(item.nome) || { vendas: 0, receita: 0 };
        atual.vendas += item.quantidade;
        atual.receita += item.quantidade * item.preco;
        produtos.set(item.nome, atual);
      });
      const ranking = [...produtos.entries()].sort((a, b) => b[1].vendas - a[1].vendas).slice(0, 5);
      const maiorVenda = ranking[0]?.[1].vendas || 1;
      this.produtosMaisVendidos = ranking.map(([produto, dados], index) => ({
        posicao: index + 1,
        produto,
        vendas: dados.vendas,
        receita: dados.receita,
        performance: (dados.vendas / maiorVenda) * 100
      }));
    });
  }
  voltar(): void {
    this.router.navigate(['/dashboard']);
  }
  logout(): void {
  this.router.navigate(['/']); // Redireciona para a rota inicial ou de login
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
