import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Firestore,
  collection,
  doc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from '@angular/fire/firestore';

import { Pedido } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private listaPedidos: Pedido[] = [];
  private pedidosSubject = new BehaviorSubject<Pedido[]>([]);

  pedidos$ = this.pedidosSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private ngZone: NgZone
  ) {
    this.escutarPedidosFirebase();
  }

  private escutarPedidosFirebase(): void {
    const pedidosRef = collection(this.firestore, 'pedidos');

    const pedidosQuery = query(pedidosRef, orderBy('dataCriacao', 'desc'));

    onSnapshot(pedidosQuery, {
      next: snapshot => {
        this.ngZone.run(() => {
          this.listaPedidos = snapshot.docs.map(docSnap =>
            this.converterPedidoFirebaseParaLoja({ id: docSnap.id, ...docSnap.data() })
          );
          this.pedidosSubject.next([...this.listaPedidos]);
        });
      },
      error: error => {
        console.error('[Admin PedidoService] Erro ao ordenar pedidos por dataCriacao. Usando leitura sem orderBy.', error);

        onSnapshot(pedidosRef, {
          next: snapshot => {
            this.ngZone.run(() => {
              this.listaPedidos = snapshot.docs
                .map(docSnap => this.converterPedidoFirebaseParaLoja({ id: docSnap.id, ...docSnap.data() }))
                .sort((a, b) => b.tempoInicio.getTime() - a.tempoInicio.getTime());
              this.pedidosSubject.next([...this.listaPedidos]);
            });
          },
          error: fallbackError => {
            console.error('[Admin PedidoService] Erro ao ler collection pedidos.', fallbackError);
            this.ngZone.run(() => {
              this.listaPedidos = [];
              this.pedidosSubject.next([...this.listaPedidos]);
            });
          }
        });
      }
    });
  }

  getPedidos(): Observable<Pedido[]> {
    return this.pedidos$;
  }

  async addPedido(pedido: Pedido): Promise<void> {
    const pedidosRef = collection(this.firestore, 'pedidos');

    await addDoc(pedidosRef, {
      uidUsuario: 'loja',
      nomeUsuario: pedido.cliente,
      emailUsuario: '',
      telefoneUsuario: pedido.telefone,
      enderecoEntrega: {
        rua: pedido.endereco
      },
      itens: pedido.itens.map(item => ({
        nome: item.nome,
        quantidade: item.quantidade,
        precoUnitario: item.preco
      })),
      pagamento: {
        tipo: pedido.pagamento
      },
      observacao: '',
      valores: {
        subtotal: pedido.valorTotal,
        taxaEntrega: 0,
        total: pedido.valorTotal
      },
      status: this.converterStatusLojaParaFirebase(pedido.status),
      dataCriacao: new Date()
    });
  }

  async updatePedidoStatus(
    id: string,
    novoStatus: Pedido['status']
  ): Promise<void> {
    const pedidoRef = doc(this.firestore, `pedidos/${id}`);

    try {
      await updateDoc(pedidoRef, {
        status: this.converterStatusLojaParaFirebase(novoStatus),
        ...(novoStatus === 'entregue' ? { dataEntrega: new Date() } : {})
      });
    } catch (error) {
      console.error(`[Admin PedidoService] Erro ao atualizar status do pedido ${id}.`, error);
      throw error;
    }
  }

  async atribuirMotoboy(id: string, motoboyId: string, motoboyNome: string): Promise<void> {
    await updateDoc(doc(this.firestore, `pedidos/${id}`), {
      motoboyId,
      motoboyNome,
      status: this.converterStatusLojaParaFirebase('entrega'),
      dataSaidaEntrega: new Date()
    });
  }

  getCalculosAdministrativos() {
    const finalizados = this.listaPedidos.filter(p => p.status === 'entregue');
    const faturamento = finalizados.reduce((acc, p) => acc + p.valorTotal, 0);

    return {
      faturamentoHoje: faturamento,
      totalPedidos: this.listaPedidos.length,
      ticketMedio: faturamento / (finalizados.length || 1),
      pedidosAtraso: this.listaPedidos.filter(p => p.status === 'atrasado').length,
      statusContagem: {
        entregue: this.listaPedidos.filter(p => p.status === 'entregue').length,
        preparo: this.listaPedidos.filter(p => p.status === 'preparo').length,
        entrega: this.listaPedidos.filter(p => p.status === 'entrega').length,
        aguardando: this.listaPedidos.filter(
          p => p.status === 'aguardando' || p.status === 'pronto' || p.status === 'recebido'
        ).length
      }
    };
  }

  private converterPedidoFirebaseParaLoja(data: any): Pedido {
    return {
      id: data.id,
      numero: data.numero || `#${String(data.id).slice(-5).toUpperCase()}`,
      cliente: data.nomeUsuario || data.cliente || data.nome || 'Cliente não informado',
      telefone: data.telefoneUsuario || data.telefone || '',
      endereco: this.formatarEndereco(data.enderecoEntrega),
      itens: (data.itens || []).map((item: any) => ({
        nome: item.nome || item.name || item.product?.name || 'Item',
        quantidade: Number(item.quantidade || 1),
        preco: Number(item.precoUnitario || item.preco || item.price || 0)
      })),
      valorTotal: Number(data.valores?.total || data.total || 0),
      pagamento: this.formatarPagamento(data.pagamento),
      status: this.converterStatusFirebaseParaLoja(data.status),
      tempoInicio: this.converterData(data.dataCriacao),
      motoboyId: data.motoboyId,
      motoboyNome: data.motoboyNome
    };
  }

  private formatarEndereco(endereco: any): string {
    if (!endereco) return 'Endereço não informado';

    if (typeof endereco === 'string') {
      return endereco;
    }

    const partes = [
      endereco.rua,
      endereco.numero,
      endereco.bairro,
      endereco.cidade,
      endereco.estado
    ].filter(Boolean);

    return partes.length ? partes.join(', ') : 'Endereço não informado';
  }

  private formatarPagamento(pagamento: any): string {
    if (!pagamento) return 'Não informado';

    if (typeof pagamento === 'string') {
      return pagamento;
    }

    return pagamento.tipo || pagamento.metodo || pagamento.forma || 'Não informado';
  }

  private converterData(data: any): Date {
    if (!data) return new Date();

    if (data.toDate) {
      return data.toDate();
    }

    return new Date(data);
  }

  private converterStatusFirebaseParaLoja(status: string): Pedido['status'] {
    const statusLower = String(status || '').toLowerCase();

    if (statusLower.includes('entregue')) return 'entregue';
    if (statusLower.includes('entrega') || statusLower.includes('caminho')) return 'entrega';
    if (statusLower.includes('pronto')) return 'pronto';
    if (statusLower.includes('prepar')) return 'preparo';
    if (statusLower.includes('aguard')) return 'aguardando';
    if (statusLower.includes('atras')) return 'atrasado';
    if (statusLower.includes('confirm') || statusLower.includes('receb')) return 'recebido';

    return 'recebido';
  }

  private converterStatusLojaParaFirebase(status: Pedido['status']): string {
    const mapa: Record<Pedido['status'], string> = {
      recebido: 'Pedido confirmado',
      aguardando: 'Aguardando preparo',
      preparo: 'Preparando pedido',
      pronto: 'Pedido pronto',
      entrega: 'Saiu para entrega',
      entregue: 'Entregue',
      atrasado: 'Pedido atrasado'
    };

    return mapa[status] || 'Pedido confirmado';
  }
}
