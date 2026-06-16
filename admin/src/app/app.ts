import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // <-- Importe o RouterOutlet para as rotas funcionarem!

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // <-- O app.ts só precisa do RouterOutlet para renderizar as páginas das rotas
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('meu-projeto-angular');
}