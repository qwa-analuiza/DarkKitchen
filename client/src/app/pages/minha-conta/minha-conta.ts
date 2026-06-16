import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { PedidoService } from '../../services/pedido.service';

import { onAuthStateChanged, Auth } from '@angular/fire/auth';
import { doc, onSnapshot, Firestore } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-minha-conta',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './minha-conta.html',
  styleUrl: './minha-conta.css',
})
export class MinhaContaComponent implements OnInit, OnDestroy {
  
  usuario: any = { nome: 'Carregando...', email: 'Carregando...' };
  endereco: any = { rua: '', numero: '', bairro: '' };
  pedidos: any[] = [];

  showModalDados: boolean = false;
  showModalEndereco: boolean = false;
  tempUsuario: any = {};
  tempEndereco: any = {};

  private pedidosSubscription: Subscription | null = null;
  private unsubscribeProfile: any = null;

  constructor(
    private firebaseService: FirebaseService,
    private pedidoService: PedidoService, 
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.carregarEnderecoLocal();
    this.escutarLoginEPerfil();
  }

  ngOnDestroy() {
    if (this.pedidosSubscription) this.pedidosSubscription.unsubscribe();
    if (this.unsubscribeProfile) this.unsubscribeProfile();
  }

  carregarEnderecoLocal() {
    const endLocal = localStorage.getItem('endereco_entrega');
    if (endLocal) {
      this.endereco = JSON.parse(endLocal);
    }
  }

  escutarLoginEPerfil() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.usuario.email = user.email || 'Sem e-mail';
        this.usuario.nome = user.displayName || user.email?.split('@')[0] || 'Cliente';
        this.escutarPerfilFirestore(user.uid);
        this.buscarPedidosDoBanco(user.uid);
        return;
      }

      this.usuario.nome = 'Visitante';
      this.usuario.email = 'Desconectado';
      this.pedidos = [];
      this.cdr.detectChanges();
    });
  }

  private escutarPerfilFirestore(uid: string) {
    if (this.unsubscribeProfile) this.unsubscribeProfile();
    const docRef = doc(this.firestore, `usuarios/${uid}`);
    this.unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const perfil = docSnap.data();
        this.usuario.nome = perfil['nome'] || this.usuario.nome;
        this.endereco = perfil['endereco'] || this.endereco;
      }
      this.cdr.detectChanges();
    });
  }

  // 🍔 2. BUSCA OS PEDIDOS
  private buscarPedidosDoBanco(uid: string) {
    console.log('🔎 [Minha Conta] Solicitando pedidos para UID:', uid);

    if (this.pedidosSubscription) this.pedidosSubscription.unsubscribe();

    this.pedidosSubscription = this.firebaseService.buscarPedidosUsuario(uid).subscribe({
      next: (dados: any[]) => {
        console.log('📦 [Minha Conta] Pedidos brutos do Firestore:', dados);

        const listaMapeada = dados.map(pedido => {
          let dataFormatada = 'Recente';
          let timestamp = 0;
          
          if (pedido.dataCriacao) {
            try {
              const t = pedido.dataCriacao;
              // Firestore Timestamp vs JS Date
              const dateObj = t.seconds ? new Date(t.seconds * 1000) : (t instanceof Date ? t : new Date(t));
              dataFormatada = dateObj.toLocaleDateString('pt-BR');
              timestamp = dateObj.getTime();
            } catch (e) {
              console.warn('Erro ao formatar data do pedido:', e);
            }
          }

          const statusRaw = pedido.status || 'Pedido confirmado';
          const isEntregue = statusRaw.toLowerCase().includes('entregue');

          return {
            id: pedido.id,
            status: statusRaw,
            estaEmAndamento: !isEntregue,
            data: dataFormatada,
            timestamp: timestamp,
            total: pedido.valores?.total || pedido.total || 0,
            totalItens: pedido.itens ? pedido.itens.length : (pedido.totalItens || 1)
          };
        });

        this.pedidos = listaMapeada.sort((a, b) => b.timestamp - a.timestamp);
        console.log('📊 [Minha Conta] Pedidos processados:', this.pedidos);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ [Minha Conta] Erro na busca de pedidos:', err);
      }
    });
  }

  // --- MODAIS ---
  abrirModalDados() { this.tempUsuario = { ...this.usuario }; this.showModalDados = true; }
  
  async salvarDadosPessoais() { 
    if (!this.tempUsuario.nome.trim()) return; 
    
    const user = this.auth.currentUser || this.firebaseService.getCurrentUser();
    if (user) {
      await this.firebaseService.salvarPerfilUsuario(user.uid, { nome: this.tempUsuario.nome });
    }
    this.showModalDados = false; 
  }

  abrirModalEndereco() { this.tempEndereco = { ...this.endereco }; this.showModalEndereco = true; }
  
  async salvarEndereco() { 
    if (!this.tempEndereco.rua.trim() || !this.tempEndereco.numero.trim()) return; 
    
    const user = this.auth.currentUser || this.firebaseService.getCurrentUser();
    if (user) {
      await this.firebaseService.salvarPerfilUsuario(user.uid, { endereco: this.tempEndereco });
    }
    this.showModalEndereco = false; 
  }
  
  irParaRastreamento(pedido: any) { 
    this.router.navigate(['/rastreamento', pedido.id]); 
  }
  
  logout() { this.firebaseService.logout().then(() => { localStorage.clear(); sessionStorage.clear(); this.router.navigate(['/']); }); }
}
