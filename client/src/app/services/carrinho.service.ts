import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {

  private itens: any[] = [];

  constructor() {

    const dados = localStorage.getItem('carrinho');

    if (dados) {
      this.itens = JSON.parse(dados);
    }
  }

  adicionarItem(item: any) {

    this.itens.push(item);

    this.salvar();
  }

  obterItens() {
    return this.itens;
  }

  removerItem(index: number) {

    this.itens.splice(index, 1);

    this.salvar();
  }

  limparCarrinho() {

    this.itens = [];

    this.salvar();
  }

  private salvar() {

    localStorage.setItem(
      'carrinho',
      JSON.stringify(this.itens)
    );
  }
}