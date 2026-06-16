import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { CarrinhoService } from './carrinho.service';
import { FirebaseService } from './firebase.service'; 

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  
  private dadosPagamentoAtual: any = null;
  private enderecoSelecionadoAtual: any = {};
  public observacoesPedido: string = '';

  // 🆕 Começa como um array vazio para receber os itens REAIS do seu carrinho
  public itensCarrinho: any[] = [];
  public taxaEntrega = 8.90;

  constructor(
    private auth: Auth,
    private firestore: Firestore, 
    private firebaseService: FirebaseService,
    private carrinhoService: CarrinhoService
  ) {}

  // 🆕 FUNÇÃO PARA O SEU CARRINHO INJETAR OS PRODUTOS REAIS
  setItensCarrinho(itens: any[], taxa: number = this.taxaEntrega) {
    this.itensCarrinho = itens.map(item => {
      // Calcula o preço unitário real (base + extras)
      let precoBase = Number(item.product?.price || item.precoUnitario || item.price || 0);
      let valorExtras = 0;
      if (item.extras) {
        item.extras.forEach((e: any) => valorExtras += Number(e.price || 0));
      }
      
      return {
        nome: item.product?.name || item.nome || 'Item do Carrinho',
        quantidade: item.quantity || item.quantidade || 1,
        precoUnitario: precoBase + valorExtras,
        extras: item.extras || [],
        observacao: item.observation || ''
      };
    });
    this.taxaEntrega = taxa;
    console.log('🛒 Itens sincronizados com sucesso no PedidoService:', this.itensCarrinho);
  }

  // 🧮 CALCULA O SUBTOTAL DINAMICAMENTE BASEADO NOS ITENS REAIS
  get subtotal(): number {
    return this.itensCarrinho.reduce((acc, item) => acc + (item.precoUnitario * item.quantidade), 0);
  }

  // 🧮 CALCULA O TOTAL DINAMICAMENTE
  get total(): number {
    return this.subtotal + this.taxaEntrega;
  }

  setPagamento(dados: any) { this.dadosPagamentoAtual = dados; }
  getPagamento() { return this.dadosPagamentoAtual; }
  setEndereco(dados: any) { this.enderecoSelecionadoAtual = dados; }
  getEndereco() { return this.enderecoSelecionadoAtual; }

  async buscarEnderecoPadrao(): Promise<any> {
    const usuario = this.auth.currentUser || this.firebaseService.getCurrentUser();
    if (!usuario) return this.enderecoSelecionadoAtual;

    try {
      const perfil: any = await this.firebaseService.buscarPerfilUsuario(usuario.uid);
      if (perfil && perfil['endereco']) {
        this.enderecoSelecionadoAtual = perfil['endereco'];
        return this.enderecoSelecionadoAtual;
      }
    } catch (e) {
      console.warn('Não foi possível ler endereço do Firestore, usando padrão da memória.', e);
    }
    return this.enderecoSelecionadoAtual;
  }

async salvarPedidoNoFirestore(dadosPagamento: any): Promise<string> {
  const usuario = this.auth.currentUser || this.firebaseService.getCurrentUser();
  
  const uidFinal = usuario ? usuario.uid : 'anonimo';
  const emailFinal = usuario ? (usuario.email || '') : '';
  
  // Tenta buscar o nome real no Firestore, senão usa displayName ou e-mail
  let nomeFinal = 'Cliente Anônimo';
  let telefoneFinal = '';

  if (usuario) {
    const perfil: any = await this.firebaseService.buscarPerfilUsuario(usuario.uid);
    if (perfil) {
      nomeFinal = perfil['nome'] || usuario.displayName || emailFinal.split('@')[0];
      telefoneFinal = perfil['telefone'] || '';
    } else {
      nomeFinal = usuario.displayName || emailFinal.split('@')[0];
    }
  }

  // Montamos o documento completo que vai pro Firebase
  const novoPedido = {
    uidUsuario: uidFinal, 
    nomeUsuario: nomeFinal,
    emailUsuario: emailFinal,
    telefoneUsuario: telefoneFinal,
    enderecoEntrega: this.enderecoSelecionadoAtual,
    itens: this.itensCarrinho, 
    pagamento: dadosPagamento,
    observacao: this.observacoesPedido,
    valores: {
      subtotal: this.subtotal,
      taxaEntrega: this.taxaEntrega,
      total: this.total
    },
    status: 'Pedido confirmado',
    dataCriacao: new Date() 
  };

  console.log('🚀 Gravando pedido unificado no Firestore...', novoPedido);

  // 1. Grava no banco usando a estrutura do AngularFire
  const ref = collection(this.firestore, 'pedidos');
  const docRef = await addDoc(ref, novoPedido);

  // 2. CRUCIAL: Limpa o carrinho para a próxima compra!
  this.carrinhoService.limparCarrinho();
  this.itensCarrinho = []; 

  return docRef.id; // Retorna o ID gerado pelo Firebase
}
}
