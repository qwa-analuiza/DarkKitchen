import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login';
import { InicioComponent } from './pages/inicio/inicio';
import { CadastroComponent } from './pages/cadastro/cadastro';
import { EsqueciComponent } from './pages/esqueci/esqueci';
import { CarrinhoComponent } from './pages/carrinho/carrinho';
import { PagamentoComponent } from './pages/pagamento/pagamento';
import { MinhaContaComponent } from './pages/minha-conta/minha-conta';
import { FinalizarPedidoComponent } from './pages/finalizar-pedido/finalizar-pedido';
import { PedidoConfirmadoComponent } from './pages/pedido-confirmado/pedido-confirmado';
import { RastreamentoComponent } from './pages/rastreamento/rastreamento';


export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'inicio', component: InicioComponent },
  { path: 'cadastro', component: CadastroComponent },
  { path: 'esqueci', component: EsqueciComponent },
  { path: 'carrinho', component: CarrinhoComponent },
  { path: 'minha-conta', component: MinhaContaComponent },
  { path: 'pagamento', component: PagamentoComponent },
  { path: 'finalizar-pedido', component: FinalizarPedidoComponent },
  { path: 'pedido-confirmado', component: PedidoConfirmadoComponent },
  { path: 'rastreamento/:id', component: RastreamentoComponent }
];