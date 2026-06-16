import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Firestore, doc, onSnapshot, Unsubscribe } from '@angular/fire/firestore';

@Component({
  selector: 'app-rastreamento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rastreamento.html',
  styleUrls: ['./rastreamento.css']
})
export class RastreamentoComponent implements OnInit, OnDestroy {

  pedidoId: string | null = null;
  private unsubscribePedido: Unsubscribe | null = null;

  pedido: any = {
    id: '',
    tempoEstimado: 35,
    endereco: { rua: 'Carregando...', bairro: '', cidade: '', estado: '', cep: '' },
    itens: [],
    subtotal: 0,
    entrega: 0,
    total: 0
  };

  etapas = [
    { titulo: 'Pedido recebido', descricao: 'Recebemos seu pedido.', concluido: false },
    { titulo: 'Pagamento aprovado', descricao: 'Pagamento confirmado.', concluido: false },
    { titulo: 'Preparando pedido', descricao: 'Seu lanche está sendo preparado.', concluido: false },
    { titulo: 'Saiu para entrega', descricao: 'O entregador está a caminho.', concluido: false },
    { titulo: 'Entregue', descricao: 'Pedido entregue com sucesso.', concluido: false }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.pedidoId = this.route.snapshot.paramMap.get('id');

    if (this.pedidoId) {
      this.pedido.id = this.pedidoId;
      this.escutarPedido(this.pedidoId);
    } else {
      this.router.navigate(['/inicio']);
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribePedido) {
      this.unsubscribePedido();
    }
  }

  private escutarPedido(id: string) {
    console.log('📡 [Rastreamento] Iniciando escuta do pedido:', id);
    const docRef = doc(this.firestore, `pedidos/${id}`);
    
    this.unsubscribePedido = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('📦 [Rastreamento] Dados recebidos:', data);

        // Mapeamento dinâmico dos campos do Firestore para a tela
        this.pedido = {
          id: id,
          tempoEstimado: data['tempoEstimado'] || 35,
          endereco: data['enderecoEntrega'] || { rua: 'Não informado' },
          itens: (data['itens'] || []).map((item: any) => ({
            quantidade: item.quantidade,
            nome: item.nome,
            descricao: item.observacao || '',
            valor: item.precoUnitario
          })),
          subtotal: data['valores']?.subtotal || 0,
          entrega: data['valores']?.taxaEntrega || 0,
          total: data['valores']?.total || 0
        };

        this.atualizarEtapas(data['status']);
        this.cdr.detectChanges(); // Força atualização da UI
      } else {
        console.error('❌ [Rastreamento] Pedido não encontrado no banco.');
      }
    }, (error) => {
      console.error('❌ [Rastreamento] Erro ao carregar pedido:', error);
    });
  }

  private atualizarEtapas(status: string) {
    const statusLower = status?.toLowerCase() || '';
    
    // Reseta as etapas
    this.etapas.forEach(e => e.concluido = false);

    // Lógica de progresso baseada na string de status salva no banco
    this.etapas[0].concluido = true; // Sempre true se o doc existe

    if (statusLower.includes('confirmado') || statusLower.includes('pago')) {
      this.etapas[1].concluido = true;
    }
    
    if (statusLower.includes('preparando') || statusLower.includes('preparação')) {
      this.etapas[1].concluido = true;
      this.etapas[2].concluido = true;
    }

    if (statusLower.includes('entrega') || statusLower.includes('caminho')) {
      this.etapas[1].concluido = true;
      this.etapas[2].concluido = true;
      this.etapas[3].concluido = true;
    }

    if (statusLower.includes('entregue')) {
      this.etapas.forEach(e => e.concluido = true);
    }
  }

  voltarInicio(): void {
    this.router.navigate(['/inicio']);
  }
}