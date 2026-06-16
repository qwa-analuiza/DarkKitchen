import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Firestore,
  collection,
  doc,
  increment,
  onSnapshot,
  updateDoc
} from '@angular/fire/firestore';
import { Motoboy } from '../models/models';
import { PedidoService } from './pedido.service';

@Injectable({ providedIn: 'root' })
export class MotoboyService {
  private motoboysSubject = new BehaviorSubject<Motoboy[]>([]);
  motoboys$ = this.motoboysSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private pedidoService: PedidoService,
    private ngZone: NgZone
  ) {
    this.escutarEntregadoresFirebase();
  }

  getMotoboys(): Observable<Motoboy[]> { return this.motoboys$; }

  async atribuirPedido(motoboyId: string, pedidoId: string): Promise<void> {
    const motoboy = this.motoboysSubject.value.find(m => m.id === motoboyId);

    if (!motoboy) {
      throw new Error('Entregador não encontrado.');
    }

    if (motoboy.status !== 'disponivel') {
      throw new Error('Entregador não está disponível.');
    }

    try {
      await Promise.all([
        updateDoc(doc(this.firestore, `entregadores/${motoboyId}`), {
          status: 'em_entrega',
          pedidoAtual: pedidoId
        }),
        this.pedidoService.atribuirMotoboy(pedidoId, motoboyId, motoboy.nome)
      ]);
    } catch (error) {
      console.error(`[MotoboyService] Erro ao atribuir pedido ${pedidoId} ao entregador ${motoboyId}.`, error);
      throw error;
    }
  }

  async finalizarEntrega(motoboyId: string, pedidoId: string): Promise<void> {
    try {
      await Promise.all([
        updateDoc(doc(this.firestore, `entregadores/${motoboyId}`), {
          status: 'disponivel',
          pedidoAtual: '',
          entregas: increment(1)
        }),
        this.pedidoService.updatePedidoStatus(pedidoId, 'entregue')
      ]);
    } catch (error) {
      console.error(`[MotoboyService] Erro ao finalizar entrega do pedido ${pedidoId}.`, error);
      throw error;
    }
  }

  getMotoboysDisponiveis(): Motoboy[] {
    return this.motoboysSubject.value.filter(m => m.status === 'disponivel');
  }

  private escutarEntregadoresFirebase(): void {
    onSnapshot(collection(this.firestore, 'entregadores'), {
      next: snapshot => {
        this.ngZone.run(() => {
          const entregadores = snapshot.docs
            .map(docSnap => this.converterEntregadorFirebase({ id: docSnap.id, ...docSnap.data() }))
            .sort((a, b) => a.nome.localeCompare(b.nome));

          this.motoboysSubject.next(entregadores);
        });
      },
      error: error => {
        console.error('[MotoboyService] Erro ao ler collection entregadores.', error);
        this.ngZone.run(() => this.motoboysSubject.next([]));
      }
    });
  }

  private converterEntregadorFirebase(data: any): Motoboy {
    return {
      id: data.id,
      nome: data.nome || data.name || 'Entregador sem nome',
      telefone: data.telefone || data.phone || '',
      avaliacao: Number(data.avaliacao ?? data.rating ?? 0),
      entregas: Number(data.entregas ?? data.deliveries ?? 0),
      status: data.status === 'em_entrega' ? 'em_entrega' : 'disponivel',
      pedidoAtual: data.pedidoAtual || data.currentOrder || ''
    };
  }
}
