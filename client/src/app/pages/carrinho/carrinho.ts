import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarrinhoService } from '../../services/carrinho.service';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrinho.html',
  styleUrl: './carrinho.css'
})
export class CarrinhoComponent implements OnInit {

  itens: any[] = [];

 constructor(
  private carrinhoService: CarrinhoService,
  private pedidoService: PedidoService,
  private router: Router
) {}

ngOnInit() {
  this.itens = this.carrinhoService.obterItens();

  console.log('Itens carrinho:', this.itens);
}
voltar() {
    this.router.navigate(['/inicio']);
  }

  remover(index: number) {
    this.carrinhoService.removerItem(index);

    this.itens = this.carrinhoService.obterItens();
  }

  getSubtotal() {
    return this.itens.reduce(
      (total, item) => total + item.total,
      0
    );
  }

getTotal() {

  if (this.itens.length === 0) {
    return 0;
  }

  return this.getSubtotal() + 8.9;
}

  aumentarQuantidade(index: number) {

  this.itens[index].quantity++;

  this.recalcularItem(index);
}

diminuirQuantidade(index: number) {

  if (this.itens[index].quantity > 1) {

    this.itens[index].quantity--;

    this.recalcularItem(index);
  }
}

recalcularItem(index: number) {

const item = this.itens[index];

let valorUnitario = Number(item.product.price);

item.extras?.forEach((extra: any) => {
  valorUnitario += Number(extra.price);
});

item.total = valorUnitario * item.quantity;

// Atualiza no localStorage também
localStorage.setItem('carrinho', JSON.stringify(this.itens));
}

irParaPagamento() {
this.pedidoService.setItensCarrinho(this.itens);
this.router.navigate(['/pagamento']);
}
}
