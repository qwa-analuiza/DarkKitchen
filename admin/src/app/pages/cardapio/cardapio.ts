import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { Prato } from '../models/models';

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, UpperCasePipe],
  templateUrl: './cardapio.html',
  styleUrl: './cardapio.scss'
})
export class CardapioComponent implements OnInit, OnDestroy {
  searchQuery = '';
  categoriaSelecionada = 'todos';
  modalNovoPratoAberto = false;
  modoEdicao = false;
  idPratoEmEdicao: string | null = null;

  pratosLista: Prato[] = [];

  pratosFiltrados: Prato[] = [];
  novoPrato: any = { nome: '', categoria: 'principais', preco: null, descricao: '', imagemUrl: '', disponivel: true };
  salvando = false;
  private produtosSubscription?: Subscription;

  constructor(
    public router: Router,
    private firestore: Firestore,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const productsRef = collection(this.firestore, 'products');
    const unsubscribe = onSnapshot(productsRef, {
      next: snapshot => {
        this.ngZone.run(() => {
          this.pratosLista = snapshot.docs.map(docSnap => {
            const product: any = { id: docSnap.id, ...docSnap.data() };
            return {
              id: product.id,
              nome: product.name || product.nome || '',
              categoria: this.categoriaParaAdmin(product.category || product.categoria),
              preco: Number(product.price || product.preco || 0),
              descricao: product.description || product.descricao || '',
              disponivel: product.available !== false && product.disponivel !== false,
              imagemUrl: product.image || product.imagem || product.imagemUrl || ''
            };
          });
          this.filtrarPratos();
        });
      },
      error: error => {
        console.error('[Admin Cardapio] Erro ao ler collection products.', error);
        this.ngZone.run(() => {
          this.pratosLista = [];
          this.filtrarPratos();
        });
      }
    });

    this.produtosSubscription = {
      unsubscribe
    } as Subscription;
  }

  get categoriasDisponiveis(): string[] {
    return [...new Set(this.pratosLista.map(prato => prato.categoria).filter(Boolean))];
  }

  nomeCategoria(categoria: string): string {
    const nomes: Record<string, string> = {
      principais: 'Pratos Principais',
      entradas: 'Entradas',
      bebidas: 'Bebidas',
      lanches: 'Lanches',
      sobremesas: 'Sobremesas',
      combos: 'Combos'
    };

    return nomes[categoria] || categoria;
  }

  ngOnDestroy(): void {
    this.produtosSubscription?.unsubscribe();
  }

  filtrarPratos(): void {
    let resultado = this.pratosLista;

    if (this.categoriaSelecionada !== 'todos') {
      resultado = resultado.filter(p => p.categoria === this.categoriaSelecionada);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      resultado = resultado.filter(p => 
        p.nome.toLowerCase().includes(query) || 
        p.descricao.toLowerCase().includes(query)
      );
    }
    this.pratosFiltrados = resultado;
  }

  filtrarPorCategoria(categoria: string): void {
    this.categoriaSelecionada = categoria;
    this.filtrarPratos();
  }

  // ATIVAÇÃO/DESATIVAÇÃO RÁPIDA: Alterna o estado booleano do item
  async alternarDisponibilidade(prato: Prato): Promise<void> {
    await updateDoc(doc(this.firestore, `products/${prato.id}`), {
      available: !prato.disponivel
    });
  }

  async deletarPrato(id: string): Promise<void> {
    if (confirm('Tem certeza que deseja remover este item do cardápio?')) {
      await deleteDoc(doc(this.firestore, `products/${id}`));
    }
  }

  processarUploadImagem(event: any): void {
    const arquivoFisico = event.target.files[0];
    if (arquivoFisico) {
      const leitorDeArquivo = new FileReader();
      leitorDeArquivo.onload = () => {
        this.novoPrato.imagemUrl = leitorDeArquivo.result as string;
      };
      leitorDeArquivo.readAsDataURL(arquivoFisico);
    }
  }

  abrirModalNovoPrato(): void {
    this.modoEdicao = false;
    this.modalNovoPratoAberto = true;
  }

  editarPrato(prato: Prato): void {
    this.modoEdicao = true;
    this.idPratoEmEdicao = prato.id;
    this.novoPrato = {
      nome: prato.nome,
      categoria: prato.categoria,
      preco: prato.preco,
      descricao: prato.descricao,
      imagemUrl: prato.imagemUrl || '',
      disponivel: prato.disponivel // Carrega o status para o modal
    };
    this.modalNovoPratoAberto = true;
  }

  fecharModalNovoPrato(): void {
    this.modalNovoPratoAberto = false;
    this.modoEdicao = false;
    this.idPratoEmEdicao = null;
    this.novoPrato = { nome: '', categoria: 'principais', preco: null, descricao: '', imagemUrl: '', disponivel: true };
  }

  async salvarNovoPrato(): Promise<void> {
    if (this.novoPrato.nome && this.novoPrato.preco && !this.salvando) {
      this.salvando = true;
      const dadosProduto = {
        name: this.novoPrato.nome,
        category: this.categoriaParaCliente(this.novoPrato.categoria),
        price: Number(this.novoPrato.preco),
        description: this.novoPrato.descricao || 'Sem descrição inserida.',
        available: this.novoPrato.disponivel,
        image: this.novoPrato.imagemUrl || ''
      };

      if (this.modoEdicao && this.idPratoEmEdicao) {
        await updateDoc(doc(this.firestore, `products/${this.idPratoEmEdicao}`), dadosProduto);
      } else {
        await addDoc(collection(this.firestore, 'products'), dadosProduto);
      }

      this.salvando = false;
      this.fecharModalNovoPrato();
    }
  }

  private categoriaParaCliente(categoria: string): string {
    return categoria === 'principais' ? 'lanches' : categoria === 'entradas' ? 'combos' : categoria;
  }

  private categoriaParaAdmin(categoria: string): string {
    return categoria || 'sem-categoria';
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
