import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; // 🆕 Injetado ActivatedRoute

@Component({
  selector: 'app-pedido-confirmado',
  templateUrl: './pedido-confirmado.html',
  styleUrls: ['./pedido-confirmado.css']
})
export class PedidoConfirmadoComponent implements OnInit {

  // Deixa de ser fixo '123456' e começa vazio aguardando o Firebase
  numeroPedido: string = '';

  enderecoEntrega = {
    rua: '',
    numero: '',
    bairro: ''
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute // 🆕 Injetado para ler os queryParams da URL
  ) {}

  ngOnInit(): void {
    // Captura o ID gerado pelo Firebase vindo da URL
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.numeroPedido = params['id'];
        console.log('Exibindo na tela o código real do pedido:', this.numeroPedido);
      } else {
        // Se tentarem acessar a página direto sem ter um ID de pedido, manda de volta
        this.router.navigate(['/inicio']);
      }
    });

    // Recupera o endereço real salvo pelo modal se quiser deixá-lo dinâmico também:
    const endLocal = localStorage.getItem('endereco_entrega');
    if (endLocal) {
      this.enderecoEntrega = JSON.parse(endLocal);
    }
  }

  fazerOutroPedido(): void {
    this.router.navigate(['/inicio']);
  }

  verMeusPedidos(): void {
    // Agora o botão de rastreamento leva para o ID real gerado no Firestore!
    this.router.navigate([
      '/rastreamento',
      this.numeroPedido
    ]);
  }
}
