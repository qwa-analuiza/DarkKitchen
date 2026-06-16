import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { CozinhaComponent } from './pages/cozinha/cozinha';
import { PedidosComponent } from './pages/pedidos/pedidos';
import { CardapioComponent } from './pages/cardapio/cardapio';
import { EntregasComponent } from './pages/entregas/entregas';
import { AdministracaoComponent } from './pages/administracao/administracao';
import { ConfiguracoesComponent } from './pages/configuracoes/configuracoes';
import { RecuperarSenhaComponent } from './pages/recuperar-senha/recuperar-senha';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'cozinha', component: CozinhaComponent },
  { path: 'pedidos', component: PedidosComponent },
  { path: 'cardapio', component: CardapioComponent },
  { path: 'entregas', component: EntregasComponent },
  { path: 'administracao', component: AdministracaoComponent },
  { path: 'configuracoes', component: ConfiguracoesComponent }, 
  { path: 'recuperar-senha', component: RecuperarSenhaComponent }, 
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];